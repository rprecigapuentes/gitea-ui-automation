import { WebDriver, By, WebElement, until } from "selenium-webdriver";
import { simulateHtml5Drag } from "../utils/html5-drag.util";

export type SearchRoot = WebDriver | WebElement;

const DEFAULT_TIMEOUT_MS = 5000;
const DRAG_THRESHOLD_PX = 5;
const DRAG_STEP_PX = 20;
const DRAG_PAUSE_MS = 200;

export interface Verifiable {
  isVisible(locators: By | By[], root?: SearchRoot, timeoutMs?: number): Promise<boolean>;
}

export abstract class BaseComponent implements Verifiable {
  constructor(protected driver: WebDriver) {}

  protected async findElements(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement[]> {
    const checkOnce = async (): Promise<WebElement[] | null> => {
      const found = await root.findElements(locator);
      if (found.length === 0) return null;
      const visible = await Promise.all(found.map((element) => element.isDisplayed()));
      return visible.every(Boolean) ? found : null;
    };

    // selenium-webdriver's driver.wait() treats a falsy timeout as unbounded, so 0 is
    // special-cased here to mean the opposite: check once, right now, and fail immediately.
    if (timeoutMs === 0) {
      const result = await checkOnce();
      if (result === null) {
        throw new Error(`No visible element(s) for locator "${locator.toString()}"`);
      }
      return result;
    }

    return this.driver.wait(
      checkOnce,
      timeoutMs,
      `No visible element(s) for locator "${locator.toString()}"`,
    ) as Promise<WebElement[]>;
  }

  protected async findElement(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement> {
    const elements = await this.findElements(locator, root, timeoutMs);

    if (elements.length > 1) {
      throw new Error(
        `Expected exactly 1 element for locator "${locator.toString()}", found ${elements.length}`,
      );
    }

    return elements[0];
  }

  async click(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const element = await this.findElement(locator, root, timeoutMs);
    await element.click();
  }

  async type(
    locator: By,
    text: string,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const element = await this.findElement(locator, root, timeoutMs);
    await element.sendKeys(text);
  }

  async clearAndType(
    locator: By,
    text: string,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const element = await this.findElement(locator, root, timeoutMs);
    await element.clear();
    await element.sendKeys(text);
  }

  /**
   * The gesture a person performs: press on the source, cross the drag threshold with short
   * offsets, travel to the target and release. Both ends are resolved here, so a caller that has
   * re-read the screen cannot drag a stale element.
   */
  async dragAndDrop(
    sourceLocator: By,
    targetLocator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const source = await this.findElement(sourceLocator, root, timeoutMs);
    const target = await this.findElement(targetLocator, root, timeoutMs);

    await this.driver
      .actions()
      .move({ origin: source })
      .press()
      .pause(DRAG_PAUSE_MS)
      .move({ origin: source, x: DRAG_THRESHOLD_PX, y: DRAG_THRESHOLD_PX })
      .move({ origin: source, x: DRAG_STEP_PX, y: DRAG_STEP_PX })
      .move({ origin: target })
      .move({ origin: target, x: 0, y: DRAG_THRESHOLD_PX })
      .pause(DRAG_PAUSE_MS)
      .release()
      .perform();
  }

  /**
   * The same drag as the events a page's own handlers listen for, for a browser driver that moves
   * the element without ever emitting the drop that finishes it (mozilla/geckodriver#1450).
   */
  async dispatchDragEvents(
    sourceLocator: By,
    targetLocator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const source = await this.findElement(sourceLocator, root, timeoutMs);
    const target = await this.findElement(targetLocator, root, timeoutMs);

    await simulateHtml5Drag(this.driver, source, target);
  }

  async getText(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<string> {
    const element = await this.findElement(locator, root, timeoutMs);
    return element.getText();
  }

  async getAttribute(
    locator: By,
    attributeName: string,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<string> {
    const element = await this.findElement(locator, root, timeoutMs);
    return (await element.getAttribute(attributeName)) ?? "";
  }

  async isVisible(
    locators: By | By[],
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<boolean> {
    const list = Array.isArray(locators) ? locators : [locators];

    if (list.length === 0) return false;

    const results = await Promise.all(
      list.map((locator) =>
        this.findElement(locator, root, timeoutMs)
          .then(() => true)
          .catch(() => false),
      ),
    );

    return results.every(Boolean);
  }

  // Predicate-based counterpart to actAndWaitFor, for state a locator alone can't express.
  protected async actAndWaitUntil(
    action: () => Promise<void>,
    predicate: () => Promise<boolean>,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await action();
    await this.driver.wait(predicate, timeoutMs);
  }

  protected async clickAndWaitUntil(
    clickLocator: By,
    predicate: () => Promise<boolean>,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await this.actAndWaitUntil(
      () => this.click(clickLocator, root, timeoutMs),
      predicate,
      timeoutMs,
    );
  }

  protected async actAndWaitFor(
    action: () => Promise<void>,
    readyLocators: By[],
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement[]> {
    await action();
    return Promise.all(readyLocators.map((locator) => this.findElement(locator, root, timeoutMs)));
  }

  protected async clickAndWaitFor(
    clickLocator: By,
    readyLocators: By[],
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement[]> {
    return this.actAndWaitFor(
      () => this.click(clickLocator, root, timeoutMs),
      readyLocators,
      root,
      timeoutMs,
    );
  }

  // For a click whose outcome is a navigation rather than an element: the page that answers it may
  // render nothing the previous one did not already have.
  protected async clickAndWaitForUrl(
    clickLocator: By,
    urlPattern: RegExp,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await this.click(clickLocator, root, timeoutMs);
    await this.driver.wait(
      until.urlMatches(urlPattern),
      timeoutMs,
      `The browser never reached a URL matching ${urlPattern.toString()}`,
    );
  }

  protected async typeAndWaitFor(
    typeLocator: By,
    text: string,
    readyLocators: By[],
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement[]> {
    return this.actAndWaitFor(
      () => this.type(typeLocator, text, root, timeoutMs),
      readyLocators,
      root,
      timeoutMs,
    );
  }

  // For an interaction the application saves after it has already changed the screen: what that
  // screen shows is not yet an answer, so the caller re-reads it and asks again.
  protected async reload(
    readyLocators: By[],
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await this.driver.navigate().refresh();
    await Promise.all(
      readyLocators.map((locator) => this.findElement(locator, this.driver, timeoutMs)),
    );
  }

  protected async waitUntil(
    condition: () => Promise<boolean>,
    message: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await this.driver.wait(condition, timeoutMs, message);
  }
}
