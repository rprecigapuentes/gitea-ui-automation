import { Page, Locator, expect } from "@playwright/test";
import { IElementHandle } from "../element-handle.interface";
import { IInteractionStrategy } from "../interaction-strategy.interface";

function toElementHandle(locator: Locator): IElementHandle {
  return {
    click: () => locator.click(),
    getText: async () => (await locator.textContent()) ?? "",
    getAttribute: async (name: string) => (await locator.getAttribute(name)) ?? "",
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

  async type(
    locator: string,
    text: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    await this.page.locator(locator).fill(text, { timeout: timeoutMs });
  }

  async clearAndType(
    locator: string,
    text: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    await this.page.locator(locator).fill(text, { timeout: timeoutMs });
  }

  async dragAndDrop(
    sourceLocator: string,
    targetLocator: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    await this.page
      .locator(sourceLocator)
      .dragTo(this.page.locator(targetLocator), { timeout: timeoutMs });
  }

  async dispatchDragEvents(
    sourceLocator: string,
    targetLocator: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    await this.dragAndDrop(sourceLocator, targetLocator, root, timeoutMs);
  }

  async getText(locator: string, root?: IElementHandle, timeoutMs?: number): Promise<string> {
    if (root) return (await root.findElement(locator)).getText();
    return (await this.page.locator(locator).textContent({ timeout: timeoutMs })) ?? "";
  }

  async getAttribute(
    locator: string,
    attributeName: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<string> {
    if (root) return (await root.findElement(locator)).getAttribute(attributeName);
    return (
      (await this.page.locator(locator).getAttribute(attributeName, { timeout: timeoutMs })) ?? ""
    );
  }

  async isVisible(
    locators: string | string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<boolean> {
    const list = Array.isArray(locators) ? locators : [locators];
    const results = await Promise.all(
      list.map((locator) =>
        this.page
          .locator(locator)
          .waitFor({ state: "visible", timeout: timeoutMs })
          .then(() => true)
          .catch(() => false),
      ),
    );
    return results.every(Boolean);
  }

  waitUntil(predicate: () => Promise<boolean>, timeoutMs?: number): Promise<boolean> {
    return expect
      .poll(predicate, { timeout: timeoutMs })
      .toBe(true)
      .then(() => true)
      .catch(() => false);
  }

  async actAndWaitUntil(
    action: () => Promise<void>,
    predicate: () => Promise<boolean>,
    timeoutMs?: number,
  ): Promise<void> {
    await action();
    await expect.poll(predicate, { timeout: timeoutMs }).toBe(true);
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
    await expect.poll(predicate, { timeout: timeoutMs, message }).toBe(true);
  }

  async waitForUrl(pattern: RegExp | string, timeoutMs?: number): Promise<void> {
    await this.page.waitForURL(pattern, { timeout: timeoutMs });
  }

  executeScript<T>(script: (...args: unknown[]) => T, ...args: unknown[]): Promise<T> {
    return this.page.evaluate(script, args[0]);
  }
}
