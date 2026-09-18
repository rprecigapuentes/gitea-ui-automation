import { IElementHandle } from "./element-handle.interface";

/**
 * The contract a page object interacts with, whatever tool (Selenium, Playwright) backs it.
 * A page never imports `selenium-webdriver` or `@playwright/test` types directly — it only ever
 * calls these methods, through the `BaseComponent`/`BasePage` Context classes that hold one of
 * these strategies (chosen by whoever constructs the page, not by the page itself).
 *
 * Locators are plain CSS-selector strings: every locator in the existing page objects is either
 * already a CSS selector or trivially expressible as one (`By.id("x")` → `"#x"`), so no separate
 * locator-strategy tagging is needed.
 */
export interface IInteractionStrategy {
  // Safe / waited / visibility-checked reads — today's BaseComponent.findElement and friends.
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
  isVisible(
    locators: string | string[],
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<boolean>;

  waitUntil(predicate: () => Promise<boolean>, timeoutMs?: number): Promise<boolean>;
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
  clickAndWaitForUrl(
    clickLocator: string,
    urlPattern: RegExp,
    root?: IElementHandle,
    timeoutMs?: number,
  ): Promise<void>;
  getCurrentUrl(): Promise<string>;
  reload(readyLocators: string[], timeoutMs?: number): Promise<void>;
  open(url: string, readyLocators?: string[], timeoutMs?: number): Promise<void>;

  /** Raw, immediate, top-level query — replaces a bare `driver.findElements(locator)`. No wait,
   *  no visibility filter, empty array on no match, never throws on absence. */
  queryAll(locator: string): Promise<IElementHandle[]>;
  /** Generic predicate wait with a custom timeout message — replaces
   *  `driver.wait(predicate, ms, "message")`. */
  waitFor(predicate: () => Promise<boolean>, timeoutMs: number, message?: string): Promise<void>;
  /** Waits for the current URL to match/contain `pattern` — replaces
   *  `driver.wait(until.urlMatches(...))`/`until.urlContains(...)`. `clickAndWaitForUrl` composes
   *  this internally rather than duplicating URL-wait logic. */
  waitForUrl(pattern: RegExp | string, timeoutMs?: number, message?: string): Promise<void>;
  /** Runs `script` in the browser — replaces a raw `driver.executeScript(...)` call. */
  executeScript<T>(script: (...args: unknown[]) => T, ...args: unknown[]): Promise<T>;
}
