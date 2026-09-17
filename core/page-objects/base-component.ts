import { IElementHandle } from "./element-handle.interface";
import { IInteractionStrategy } from "./interaction-strategy.interface";

export interface Verifiable {
  isVisible(
    locators: string | string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<boolean>;
}

/**
 * The Context in this Strategy pattern: holds whichever `IInteractionStrategy` it was constructed
 * with and only delegates to it. It never decides which strategy to use — that choice is made by
 * whoever constructs the page (see `createSeleniumStrategy`/`createPlaywrightStrategy`), so a page
 * extending this class never imports or references a specific tool's types.
 */
export abstract class BaseComponent implements Verifiable {
  constructor(protected readonly strategy: IInteractionStrategy) {}

  protected findElement(
    locator: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle> {
    return this.strategy.findElement(locator, root, timeoutMs);
  }

  protected findElements(
    locator: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]> {
    return this.strategy.findElements(locator, root, timeoutMs);
  }

  click(locator: string, root?: IElementHandle, timeoutMs?: number): Promise<void> {
    return this.strategy.click(locator, root, timeoutMs);
  }

  type(locator: string, text: string, root?: IElementHandle, timeoutMs?: number): Promise<void> {
    return this.strategy.type(locator, text, root, timeoutMs);
  }

  clearAndType(
    locator: string,
    text: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    return this.strategy.clearAndType(locator, text, root, timeoutMs);
  }

  dragAndDrop(
    sourceLocator: string,
    targetLocator: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    return this.strategy.dragAndDrop(sourceLocator, targetLocator, root, timeoutMs);
  }

  dispatchDragEvents(
    sourceLocator: string,
    targetLocator: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    return this.strategy.dispatchDragEvents(sourceLocator, targetLocator, root, timeoutMs);
  }

  getText(locator: string, root?: IElementHandle, timeoutMs?: number): Promise<string> {
    return this.strategy.getText(locator, root, timeoutMs);
  }

  getAttribute(
    locator: string,
    attributeName: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<string> {
    return this.strategy.getAttribute(locator, attributeName, root, timeoutMs);
  }

  isVisible(
    locators: string | string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<boolean> {
    return this.strategy.isVisible(locators, root, timeoutMs);
  }

  protected waitUntil(predicate: () => Promise<boolean>, timeoutMs?: number): Promise<boolean> {
    return this.strategy.waitUntil(predicate, timeoutMs);
  }

  protected actAndWaitUntil(
    action: () => Promise<void>,
    predicate: () => Promise<boolean>,
    timeoutMs?: number,
  ): Promise<void> {
    return this.strategy.actAndWaitUntil(action, predicate, timeoutMs);
  }

  protected clickAndWaitUntil(
    clickLocator: string,
    predicate: () => Promise<boolean>,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    return this.strategy.clickAndWaitUntil(clickLocator, predicate, root, timeoutMs);
  }

  protected actAndWaitFor(
    action: () => Promise<void>,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]> {
    return this.strategy.actAndWaitFor(action, readyLocators, root, timeoutMs);
  }

  protected clickAndWaitFor(
    clickLocator: string,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]> {
    return this.strategy.clickAndWaitFor(clickLocator, readyLocators, root, timeoutMs);
  }

  protected typeAndWaitFor(
    typeLocator: string,
    text: string,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]> {
    return this.strategy.typeAndWaitFor(typeLocator, text, readyLocators, root, timeoutMs);
  }

  protected clickAndWaitForUrl(
    clickLocator: string,
    urlPattern: RegExp,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void> {
    return this.strategy.clickAndWaitForUrl(clickLocator, urlPattern, root, timeoutMs);
  }

  getCurrentUrl(): Promise<string> {
    return this.strategy.getCurrentUrl();
  }

  protected reload(readyLocators: string[], timeoutMs?: number): Promise<void> {
    return this.strategy.reload(readyLocators, timeoutMs);
  }

  protected queryAll(locator: string): Promise<IElementHandle[]> {
    return this.strategy.queryAll(locator);
  }

  protected waitFor(
    predicate: () => Promise<boolean>,
    timeoutMs: number,
    message?: string,
  ): Promise<void> {
    return this.strategy.waitFor(predicate, timeoutMs, message);
  }

  protected waitForUrl(
    pattern: RegExp | string,
    timeoutMs?: number,
    message?: string,
  ): Promise<void> {
    return this.strategy.waitForUrl(pattern, timeoutMs, message);
  }

  protected executeScript<T>(script: (...args: unknown[]) => T, ...args: unknown[]): Promise<T> {
    return this.strategy.executeScript<T>(script, ...args);
  }
}
