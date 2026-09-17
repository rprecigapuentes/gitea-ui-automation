import { Page, Locator } from "@playwright/test";
import { IElementHandle } from "../element-handle.interface";
import { IInteractionStrategy } from "../interaction-strategy.interface";

export class PlaywrightElementHandle implements IElementHandle {
  constructor(readonly locator: Locator) {}

  async click(): Promise<void> {
    await this.locator.click();
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
    return Promise.resolve(new PlaywrightElementHandle(this.locator.locator(locator)));
  }

  async findElements(locator: string): Promise<IElementHandle[]> {
    const found = await this.locator.locator(locator).all();
    return found.map((element) => new PlaywrightElementHandle(element));
  }
}

export class PlaywrightInteractionStrategy implements IInteractionStrategy {
  constructor(private readonly page: Page) {}

  private locatorFor(locator: string, root?: IElementHandle): Locator {
    const base = root instanceof PlaywrightElementHandle ? root.locator : this.page;
    return base.locator(locator);
  }

  findElement(locator: string, root?: IElementHandle): Promise<IElementHandle> {
    return Promise.resolve(new PlaywrightElementHandle(this.locatorFor(locator, root)));
  }

  async findElements(locator: string, root?: IElementHandle): Promise<IElementHandle[]> {
    const found = await this.locatorFor(locator, root).all();
    return found.map((element) => new PlaywrightElementHandle(element));
  }

  async click(locator: string, root?: IElementHandle, timeoutMs?: number): Promise<void> {
    await this.locatorFor(locator, root).click({ timeout: timeoutMs });
  }

  async type(
    locator: string,
    text: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    await this.locatorFor(locator, root).fill(text, { timeout: timeoutMs });
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
