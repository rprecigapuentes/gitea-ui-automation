import { Page, Locator } from "@playwright/test";
import { IElementHandle } from "../element-handle.interface";
import { IInteractionStrategy } from "../interaction-strategy.interface";

function toElementHandle(locator: Locator): IElementHandle {
  return {
    click: () => locator.click(),
    getText: () => Promise.resolve(""),
    getAttribute: () => Promise.resolve(""),
    isSelected: () => Promise.resolve(false),
    isDisplayed: () => Promise.resolve(false),
    clear: () => Promise.resolve(),
    sendKeys: () => Promise.resolve(),
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

  clearAndType(
    locator: string,
    text: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    console.log("[playwright] clearAndType", locator, text, { root, timeoutMs });
    return Promise.resolve();
  }

  dragAndDrop(
    sourceLocator: string,
    targetLocator: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    console.log("[playwright] dragAndDrop", sourceLocator, targetLocator, { root, timeoutMs });
    return Promise.resolve();
  }

  dispatchDragEvents(
    sourceLocator: string,
    targetLocator: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    console.log("[playwright] dispatchDragEvents", sourceLocator, targetLocator, {
      root,
      timeoutMs,
    });
    return Promise.resolve();
  }

  getText(locator: string, root?: IElementHandle, timeoutMs?: number): Promise<string> {
    console.log("[playwright] getText", locator, { root, timeoutMs });
    return Promise.resolve("");
  }

  getAttribute(
    locator: string,
    attributeName: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<string> {
    console.log("[playwright] getAttribute", locator, attributeName, { root, timeoutMs });
    return Promise.resolve("");
  }

  isVisible(
    locators: string | string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<boolean> {
    console.log("[playwright] isVisible", locators, { root, timeoutMs });
    return Promise.resolve(false);
  }

  waitUntil(predicate: () => Promise<boolean>, timeoutMs?: number): Promise<boolean> {
    console.log("[playwright] waitUntil", { timeoutMs });
    return Promise.resolve(false);
  }

  actAndWaitUntil(
    action: () => Promise<void>,
    predicate: () => Promise<boolean>,
    timeoutMs?: number,
  ): Promise<void> {
    console.log("[playwright] actAndWaitUntil", { timeoutMs });
    return Promise.resolve();
  }

  clickAndWaitUntil(
    clickLocator: string,
    predicate: () => Promise<boolean>,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    console.log("[playwright] clickAndWaitUntil", clickLocator, { root, timeoutMs });
    return Promise.resolve();
  }

  actAndWaitFor(
    action: () => Promise<void>,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]> {
    console.log("[playwright] actAndWaitFor", readyLocators, { root, timeoutMs });
    return Promise.resolve([]);
  }

  clickAndWaitFor(
    clickLocator: string,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]> {
    console.log("[playwright] clickAndWaitFor", clickLocator, readyLocators, { root, timeoutMs });
    return Promise.resolve([]);
  }

  typeAndWaitFor(
    typeLocator: string,
    text: string,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]> {
    console.log("[playwright] typeAndWaitFor", typeLocator, readyLocators, { root, timeoutMs });
    return Promise.resolve([]);
  }

  clickAndWaitForUrl(
    clickLocator: string,
    urlPattern: RegExp,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    console.log("[playwright] clickAndWaitForUrl", clickLocator, urlPattern, { root, timeoutMs });
    return Promise.resolve();
  }

  getCurrentUrl(): Promise<string> {
    console.log("[playwright] getCurrentUrl");
    return Promise.resolve("");
  }

  reload(readyLocators: string[], timeoutMs?: number): Promise<void> {
    console.log("[playwright] reload", readyLocators, { timeoutMs });
    return Promise.resolve();
  }

  open(url: string, readyLocators?: string[], timeoutMs?: number): Promise<void> {
    console.log("[playwright] open", url, readyLocators, { timeoutMs });
    return Promise.resolve();
  }

  queryAll(locator: string): Promise<IElementHandle[]> {
    console.log("[playwright] queryAll", locator);
    return Promise.resolve([]);
  }

  waitFor(predicate: () => Promise<boolean>, timeoutMs: number, message?: string): Promise<void> {
    console.log("[playwright] waitFor", { timeoutMs, message });
    return Promise.resolve();
  }

  waitForUrl(pattern: RegExp | string, timeoutMs?: number, message?: string): Promise<void> {
    console.log("[playwright] waitForUrl", pattern, { timeoutMs, message });
    return Promise.resolve();
  }

  executeScript<T>(script: (...args: unknown[]) => T, ...args: unknown[]): Promise<T> {
    console.log("[playwright] executeScript", { args });
    return Promise.resolve(undefined as T);
  }
}
