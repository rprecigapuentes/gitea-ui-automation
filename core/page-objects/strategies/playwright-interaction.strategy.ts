import { Page, Locator } from "@playwright/test";
import { IElementHandle } from "../element-handle.interface";
import { IInteractionStrategy } from "../interaction-strategy.interface";
import { simulateHtml5Drag } from "./utils/playwright-html5-drag.util";

const DEFAULT_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 100;

// Playwright's Page waits on locators and in-page functions, not on a Node predicate, so this polls
// the way Selenium's driver.wait does.
async function poll(predicate: () => Promise<boolean>, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (!(await predicate())) {
    if (Date.now() >= deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return true;
}

// Like WebElement.getAttribute: the string property when the element carries one, the content
// attribute otherwise. An input's typed value only lives in the property.
async function readAttribute(locator: Locator, name: string): Promise<string> {
  const value = await locator.evaluate((element, attribute) => {
    const property = (element as unknown as Record<string, unknown>)[attribute];
    return typeof property === "string" ? property : element.getAttribute(attribute);
  }, name);

  return value ?? "";
}

function toElementHandle(locator: Locator): IElementHandle {
  return {
    click: () => locator.click(),
    // Trimmed, like WebElement.getText. textContent returns the raw node content.
    getText: async () => ((await locator.textContent()) ?? "").trim(),
    getAttribute: (name: string) => readAttribute(locator, name),
    isSelected: () => locator.isChecked(),
    isDisplayed: () => locator.isVisible(),
    clear: () => locator.clear(),
    sendKeys: (text: string) => locator.fill(text),
    findElement: (childLocator: string) =>
      Promise.resolve(toElementHandle(locator.locator(childLocator))),
    findElements: async (childLocator: string) =>
      (await locator.locator(childLocator).all()).map(toElementHandle),
  };
}

/**
 * Playwright locators are lazy and auto-wait, so `findElement` returns without waiting; the wait
 * happens on the first action. `root` scopes reads and click only: `type`, `clearAndType` and
 * `dragAndDrop` address the whole page.
 */
export class PlaywrightInteractionStrategy implements IInteractionStrategy {
  constructor(private readonly page: Page) {}

  findElement(locator: string, root?: IElementHandle): Promise<IElementHandle> {
    if (root) return root.findElement(locator);
    return Promise.resolve(toElementHandle(this.page.locator(locator)));
  }

  async findElements(locator: string, root?: IElementHandle): Promise<IElementHandle[]> {
    if (root) return root.findElements(locator);
    return (await this.page.locator(locator).all()).map(toElementHandle);
  }

  async click(locator: string, root?: IElementHandle, timeoutMs?: number): Promise<void> {
    if (root) {
      await (await root.findElement(locator)).click();
      return;
    }
    await this.page.locator(locator).click({ timeout: timeoutMs });
  }

  // Appends keystrokes like WebElement.sendKeys, where fill() would replace the field's value.
  async type(
    locator: string,
    text: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    await this.page.locator(locator).pressSequentially(text, { timeout: timeoutMs });
  }

  async clearAndType(
    locator: string,
    text: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    await this.page.locator(locator).fill(text, { timeout: timeoutMs });
  }

  // The mouse is moved by hand, not with Locator.dragTo(): Gitea's board reacts to a real, gradual
  // mousemove/mouseup sequence, not to the native HTML5 drag events dragTo() dispatches.
  async dragAndDrop(sourceLocator: string, targetLocator: string): Promise<void> {
    const sourceBox = await this.page.locator(sourceLocator).boundingBox();
    const targetBox = await this.page.locator(targetLocator).boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error("dragAndDrop could not resolve a bounding box for its source or target");
    }

    await this.page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2,
    );
    await this.page.mouse.down();
    await this.page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 10 },
    );
    await this.page.mouse.up();
  }

  /** For a browser whose protocol moves the pointer but never emits the drop (Firefox). */
  async dispatchDragEvents(sourceLocator: string, targetLocator: string): Promise<void> {
    await simulateHtml5Drag(this.page.locator(sourceLocator), this.page.locator(targetLocator));
  }

  // The rendered text, trimmed like WebElement.getText, not the raw nodes with their whitespace.
  async getText(locator: string, root?: IElementHandle, timeoutMs?: number): Promise<string> {
    if (root) return (await root.findElement(locator)).getText();
    return ((await this.page.locator(locator).textContent({ timeout: timeoutMs })) ?? "").trim();
  }

  async getAttribute(
    locator: string,
    attributeName: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<string> {
    if (root) return (await root.findElement(locator)).getAttribute(attributeName);
    // The attribute holds the initial value; what was typed is only in the property.
    if (attributeName === "value")
      return this.page.locator(locator).inputValue({ timeout: timeoutMs });
    return (
      (await this.page.locator(locator).getAttribute(attributeName, { timeout: timeoutMs })) ?? ""
    );
  }

  async isVisible(
    locators: string | string[],
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<boolean> {
    const list = Array.isArray(locators) ? locators : [locators];
    if (root) {
      const visible = await Promise.all(
        list.map(async (locator) => (await root.findElement(locator)).isDisplayed()),
      );
      return visible.every(Boolean);
    }
    // Playwright treats a `timeout` of 0 as "wait forever", the opposite of "check right now", so 0
    // skips waitFor. A locator that never shows is a false here, not an error.
    const results = await Promise.all(
      list.map((locator) =>
        timeoutMs === 0
          ? this.page.locator(locator).isVisible()
          : this.page
              .locator(locator)
              .waitFor({ state: "visible", timeout: timeoutMs })
              .then(() => true)
              .catch(() => false),
      ),
    );
    return results.every(Boolean);
  }

  waitUntil(
    predicate: () => Promise<boolean>,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<boolean> {
    return poll(predicate, timeoutMs);
  }

  async actAndWaitUntil(
    action: () => Promise<void>,
    predicate: () => Promise<boolean>,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await action();
    await this.waitFor(predicate, timeoutMs);
  }

  async clickAndWaitUntil(
    clickLocator: string,
    predicate: () => Promise<boolean>,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    await this.actAndWaitUntil(
      () => this.click(clickLocator, root, timeoutMs),
      predicate,
      timeoutMs,
    );
  }

  async actAndWaitFor(
    action: () => Promise<void>,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]> {
    await action();
    return Promise.all(
      readyLocators.map(async (locator) => {
        if (root) return root.findElement(locator);
        const target = this.page.locator(locator);
        await target.waitFor({ timeout: timeoutMs });
        return toElementHandle(target);
      }),
    );
  }

  clickAndWaitFor(
    clickLocator: string,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]> {
    return this.actAndWaitFor(
      () => this.click(clickLocator, root, timeoutMs),
      readyLocators,
      root,
      timeoutMs,
    );
  }

  typeAndWaitFor(
    typeLocator: string,
    text: string,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]> {
    return this.actAndWaitFor(
      () => this.type(typeLocator, text, root, timeoutMs),
      readyLocators,
      root,
      timeoutMs,
    );
  }

  async clickAndWaitForUrl(
    clickLocator: string,
    urlPattern: RegExp,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    await Promise.all([
      this.page.waitForURL(urlPattern, { timeout: timeoutMs }),
      this.click(clickLocator, root, timeoutMs),
    ]);
  }

  getCurrentUrl(): Promise<string> {
    return Promise.resolve(this.page.url());
  }

  async reload(readyLocators: string[], timeoutMs?: number): Promise<void> {
    await this.page.reload();
    await Promise.all(
      readyLocators.map((locator) => this.page.locator(locator).waitFor({ timeout: timeoutMs })),
    );
  }

  async open(url: string, readyLocators: string[] = [], timeoutMs?: number): Promise<void> {
    await this.page.goto(url);
    await Promise.all(
      readyLocators.map((locator) => this.page.locator(locator).waitFor({ timeout: timeoutMs })),
    );
  }

  async queryAll(locator: string): Promise<IElementHandle[]> {
    return (await this.page.locator(locator).all()).map(toElementHandle);
  }

  async waitFor(
    predicate: () => Promise<boolean>,
    timeoutMs: number,
    message?: string,
  ): Promise<void> {
    if (!(await poll(predicate, timeoutMs))) {
      throw new Error(message ?? `Timed out after ${timeoutMs}ms waiting for condition`);
    }
  }

  async waitForUrl(pattern: RegExp | string, timeoutMs?: number): Promise<void> {
    await this.page.waitForURL(pattern, { timeout: timeoutMs });
  }

  executeScript<T>(script: (...args: unknown[]) => T, ...args: unknown[]): Promise<T> {
    // page.evaluate takes one argument, so only the first is forwarded.
    return this.page.evaluate(script, args[0]);
  }
}
