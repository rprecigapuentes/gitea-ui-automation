/**
 * What `findElement`/`findElements` return, replacing a raw Selenium `WebElement` (and, once
 * `PlaywrightInteractionStrategy` is real, wrapping a Playwright `Locator`). Every method here is
 * raw and immediate — no wait, no visibility filter, no retry — mirroring native `WebElement`
 * semantics exactly, since that's what every existing scoped read (e.g. reading several
 * `data-*` attributes off one already-found row) already assumes.
 */
export interface IElementHandle {
  click(): Promise<void>;
  getText(): Promise<string>;
  getAttribute(name: string): Promise<string>;
  isSelected(): Promise<boolean>;
  isDisplayed(): Promise<boolean>;
  clear(): Promise<void>;
  sendKeys(text: string): Promise<void>;

  /** Scoped to this element. Throws if nothing matches (parity with a native `findElement`). */
  findElement(locator: string): Promise<IElementHandle>;
  /** Scoped to this element. Empty array if nothing matches — never throws on absence. */
  findElements(locator: string): Promise<IElementHandle[]>;
}
