/**
 * What `findElement`/`findElements` return: a wrapped Selenium `WebElement` or Playwright Locator.
 * On Selenium every method is raw and immediate (no wait, no retry); on Playwright it is the
 * Locator's own, which auto-waits. Callers use it to read several things off one found row.
 */
export interface IElementHandle {
  click(): Promise<void>;
  getText(): Promise<string>;
  getAttribute(name: string): Promise<string>;
  isSelected(): Promise<boolean>;
  isDisplayed(): Promise<boolean>;
  clear(): Promise<void>;
  sendKeys(text: string): Promise<void>;

  /** Scoped to this element. Selenium throws if nothing matches; Playwright fails on first use. */
  findElement(locator: string): Promise<IElementHandle>;
  /** Scoped to this element. Empty array if nothing matches — never throws on absence. */
  findElements(locator: string): Promise<IElementHandle[]>;
}
