import { Page, Locator } from "@playwright/test";
import { IElementHandle } from "../element-handle.interface";
import { IInteractionStrategy } from "../interaction-strategy.interface";

/**
 * Stub implementation — every method logs and returns a type-satisfying placeholder, never
 * throws. Real Playwright interaction logic is deliberately deferred to a later phase; this only
 * needs to exist so a page object typechecks and runs (without crashing) when constructed with
 * this strategy, proving it has no remaining Selenium dependency.
 */
export class PlaywrightElementHandle implements IElementHandle {
  constructor(private readonly locator: Locator) {}

  click(): Promise<void> {
    console.log("[playwright] IElementHandle.click");
    return Promise.resolve();
  }

  getText(): Promise<string> {
    console.log("[playwright] IElementHandle.getText");
    return Promise.resolve("");
  }

  getAttribute(name: string): Promise<string> {
    console.log("[playwright] IElementHandle.getAttribute", name);
    return Promise.resolve("");
  }

  isSelected(): Promise<boolean> {
    console.log("[playwright] IElementHandle.isSelected");
    return Promise.resolve(false);
  }

  isDisplayed(): Promise<boolean> {
    console.log("[playwright] IElementHandle.isDisplayed");
    return Promise.resolve(false);
  }

  clear(): Promise<void> {
    console.log("[playwright] IElementHandle.clear");
    return Promise.resolve();
  }

  sendKeys(text: string): Promise<void> {
    console.log("[playwright] IElementHandle.sendKeys", text);
    return Promise.resolve();
  }

  findElement(locator: string): Promise<IElementHandle> {
    console.log("[playwright] IElementHandle.findElement", locator);
    return Promise.resolve(new PlaywrightElementHandle(this.locator.locator(locator)));
  }

  findElements(locator: string): Promise<IElementHandle[]> {
    console.log("[playwright] IElementHandle.findElements", locator);
    return Promise.resolve([]);
  }
}

export class PlaywrightInteractionStrategy implements IInteractionStrategy {
  constructor(private readonly page: Page) {}

  findElement(locator: string, root?: IElementHandle, timeoutMs?: number): Promise<IElementHandle> {
    console.log("[playwright] findElement", locator, { root, timeoutMs });
    return Promise.resolve(new PlaywrightElementHandle(this.page.locator(locator)));
  }

  findElements(
    locator: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]> {
    console.log("[playwright] findElements", locator, { root, timeoutMs });
    return Promise.resolve([]);
  }

  click(locator: string, root?: IElementHandle, timeoutMs?: number): Promise<void> {
    console.log("[playwright] click", locator, { root, timeoutMs });
    return Promise.resolve();
  }

  type(locator: string, text: string, root?: IElementHandle, timeoutMs?: number): Promise<void> {
    console.log("[playwright] type", locator, text, { root, timeoutMs });
    return Promise.resolve();
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
