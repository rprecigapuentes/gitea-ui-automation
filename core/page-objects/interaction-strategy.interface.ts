import { IElementHandle } from "./element-handle.interface";

/**
 * What a page object calls, whatever tool backs it. A page never imports `selenium-webdriver` or
 * `@playwright/test`: it holds one of these through `BaseComponent`, chosen by whoever builds it.
 * Locators are plain CSS strings, which is what lets one page object run on both tools.
 */
export interface IInteractionStrategy {
  // Reads and actions on a locator, optionally scoped to `root`; `timeoutMs` bounds its wait.
  findElement(locator: string, root?: IElementHandle, timeoutMs?: number): Promise<IElementHandle>;
  findElements(
    locator: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]>;
  click(locator: string, root?: IElementHandle, timeoutMs?: number): Promise<void>;
  type(locator: string, text: string, root?: IElementHandle, timeoutMs?: number): Promise<void>;
  clearAndType(
    locator: string,
    text: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void>;
  dragAndDrop(
    sourceLocator: string,
    targetLocator: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void>;
  dispatchDragEvents(
    sourceLocator: string,
    targetLocator: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void>;
  getText(locator: string, root?: IElementHandle, timeoutMs?: number): Promise<string>;
  getAttribute(
    locator: string,
    attributeName: string,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<string>;
  /** True only when each locator resolves to one visible element. A timeout of 0 checks once. */
  isVisible(
    locators: string | string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<boolean>;

  /** Polls `predicate`: true once it held, false when `timeoutMs` ran out instead of throwing. */
  waitUntil(predicate: () => Promise<boolean>, timeoutMs?: number): Promise<boolean>;
  /** Runs `action`, then waits for `predicate`: state no locator can express. Throws on timeout. */
  actAndWaitUntil(
    action: () => Promise<void>,
    predicate: () => Promise<boolean>,
    timeoutMs?: number,
  ): Promise<void>;
  clickAndWaitUntil(
    clickLocator: string,
    predicate: () => Promise<boolean>,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void>;
  /** Runs `action`, then waits for every `readyLocators` entry: what proves the action finished. */
  actAndWaitFor(
    action: () => Promise<void>,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]>;
  clickAndWaitFor(
    clickLocator: string,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]>;
  typeAndWaitFor(
    typeLocator: string,
    text: string,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<IElementHandle[]>;
  /** A click whose outcome is a navigation, not an element a locator could wait for. */
  clickAndWaitForUrl(
    clickLocator: string,
    urlPattern: RegExp,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void>;
  getCurrentUrl(): Promise<string>;
  reload(readyLocators: string[], timeoutMs?: number): Promise<void>;
  /** With no `readyLocators` it returns at the browser's load event, so pass what proves it. */
  open(url: string, readyLocators?: string[], timeoutMs?: number): Promise<void>;

  /** Immediate and top-level: no wait, no visibility filter, an empty array on no match. */
  queryAll(locator: string): Promise<IElementHandle[]>;
  /** Polls `predicate` for up to `timeoutMs` and throws `message` if it never held. */
  waitFor(predicate: () => Promise<boolean>, timeoutMs: number, message?: string): Promise<void>;
  /** Waits until the current URL matches a RegExp or contains a string. */
  waitForUrl(pattern: RegExp | string, timeoutMs?: number, message?: string): Promise<void>;
  /** Runs `script` in the page. */
  executeScript<T>(script: (...args: unknown[]) => T, ...args: unknown[]): Promise<T>;
}
