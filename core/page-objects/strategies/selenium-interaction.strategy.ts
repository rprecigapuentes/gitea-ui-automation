import { WebDriver, By, WebElement, until, error as seleniumError } from "selenium-webdriver";
import { logger } from "@gitea-automation/core-logger/pino.logger";
import { simulateHtml5Drag } from "./utils/selenium-html5-drag.util";
import { IElementHandle } from "../element-handle.interface";
import { IInteractionStrategy } from "../interaction-strategy.interface";
import { InteractionInterceptedError } from "../errors";

const DEFAULT_TIMEOUT_MS = 5000;
const DRAG_THRESHOLD_PX = 5;
const DRAG_STEP_PX = 20;
const DRAG_PAUSE_MS = 200;

/** Wraps a raw Selenium `WebElement`. `webElement` is intentionally accessible (not part of the
 *  `IElementHandle` contract) so `SeleniumInteractionStrategy` can unwrap a `root` parameter back
 *  into the native type it needs. */
export class SeleniumElementHandle implements IElementHandle {
  constructor(readonly webElement: WebElement) {}

  click(): Promise<void> {
    return this.webElement.click();
  }

  getText(): Promise<string> {
    return this.webElement.getText();
  }

  async getAttribute(name: string): Promise<string> {
    return (await this.webElement.getAttribute(name)) ?? "";
  }

  isSelected(): Promise<boolean> {
    return this.webElement.isSelected();
  }

  isDisplayed(): Promise<boolean> {
    return this.webElement.isDisplayed();
  }

  clear(): Promise<void> {
    return this.webElement.clear();
  }

  sendKeys(text: string): Promise<void> {
    return this.webElement.sendKeys(text);
  }

  async findElement(locator: string): Promise<IElementHandle> {
    return new SeleniumElementHandle(await this.webElement.findElement(By.css(locator)));
  }

  async findElements(locator: string): Promise<IElementHandle[]> {
    const found = await this.webElement.findElements(By.css(locator));
    return found.map((element) => new SeleniumElementHandle(element));
  }
}

type SearchRoot = WebDriver | WebElement;

// One lookup at a time per driver, and only the lookup, never the wait around it. Added for the
// Healenium proxy, since dropped from the pipeline, which answered two concurrent lookups on one
// session from a shared context, swapped or empty. Nothing needs it now; it is cheap and stayed.
const lookupTails = new WeakMap<WebDriver, Promise<unknown>>();

async function lookUp(driver: WebDriver, root: SearchRoot, locator: By): Promise<WebElement[]> {
  const previous = lookupTails.get(driver) ?? Promise.resolve();
  const current = previous.then(() => root.findElements(locator));
  // The queue goes on after a failed lookup; the failure itself reaches the caller via `current`.
  lookupTails.set(
    driver,
    current.catch(() => undefined),
  );
  return current;
}

/**
 * Every waited lookup polls explicitly: the session's implicit wait is 0 (see `DriverFactory`), so
 * a timeout here is real time. `timeoutMs` 0 means "check once, now" rather than "wait forever".
 */
export class SeleniumInteractionStrategy implements IInteractionStrategy {
  constructor(private readonly driver: WebDriver) {}

  private resolveRoot(root?: IElementHandle): SearchRoot {
    if (!root) return this.driver;
    if (root instanceof SeleniumElementHandle) return root.webElement;
    throw new Error(
      "SeleniumInteractionStrategy received a root that is not a SeleniumElementHandle",
    );
  }

  private async findRawElements(
    locatorStr: string,
    root: SearchRoot,
    timeoutMs: number,
  ): Promise<WebElement[]> {
    const locator = By.css(locatorStr);

    // One poll: null means "not there yet" and the wait tries again. A match counts only when every
    // element is displayed, because that is what a click or a read needs, not mere presence.
    const checkOnce = async (): Promise<WebElement[] | null> => {
      try {
        const found = await lookUp(this.driver, root, locator);
        if (found.length === 0) return null;
        const visible = await Promise.all(found.map((element) => element.isDisplayed()));
        return visible.every(Boolean) ? found : null;
      } catch (error) {
        // The only errors worth another poll: a stale reference, or Chrome dropping an element's
        // CDP node mid-render. Anything else is a real failure and ends the wait.
        if (
          error instanceof seleniumError.StaleElementReferenceError ||
          (error instanceof seleniumError.WebDriverError &&
            error.message.includes("unhandled inspector error"))
        ) {
          logger.debug({ locator: locatorStr }, "Retrying a transient element error");
          return null;
        }
        throw error;
      }
    };

    // selenium-webdriver's driver.wait() treats a falsy timeout as unbounded, so 0 is
    // special-cased here to mean the opposite: check once, right now, and fail immediately.
    if (timeoutMs === 0) {
      const result = await checkOnce();
      if (result === null) {
        throw new Error(`No visible element(s) for locator "${locatorStr}"`);
      }
      return result;
    }

    return this.driver.wait(
      checkOnce,
      timeoutMs,
      `No visible element(s) for locator "${locatorStr}"`,
    ) as Promise<WebElement[]>;
  }

  private async findRawElement(
    locatorStr: string,
    root: SearchRoot,
    timeoutMs: number,
  ): Promise<WebElement> {
    const elements = await this.findRawElements(locatorStr, root, timeoutMs);

    if (elements.length > 1) {
      throw new Error(
        `Expected exactly 1 element for locator "${locatorStr}", found ${elements.length}`,
      );
    }

    return elements[0];
  }

  async findElements(
    locator: string,
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<IElementHandle[]> {
    const raw = await this.findRawElements(locator, this.resolveRoot(root), timeoutMs);
    return raw.map((element) => new SeleniumElementHandle(element));
  }

  async findElement(
    locator: string,
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<IElementHandle> {
    const element = await this.findRawElement(locator, this.resolveRoot(root), timeoutMs);
    return new SeleniumElementHandle(element);
  }

  async click(
    locator: string,
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const element = await this.findRawElement(locator, this.resolveRoot(root), timeoutMs);

    try {
      await element.click();
    } catch (error) {
      // Re-thrown as our own type, so a page can tell "an overlay covered it" from a real failure.
      if (error instanceof seleniumError.ElementClickInterceptedError) {
        throw new InteractionInterceptedError(locator, error);
      }
      throw error;
    }
  }

  async type(
    locator: string,
    text: string,
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const element = await this.findRawElement(locator, this.resolveRoot(root), timeoutMs);
    await element.sendKeys(text);
  }

  async clearAndType(
    locator: string,
    text: string,
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const element = await this.findRawElement(locator, this.resolveRoot(root), timeoutMs);
    await element.clear();
    await element.sendKeys(text);
  }

  /** Both ends resolve here, so a caller that re-read the screen cannot drag a stale element. */
  async dragAndDrop(
    sourceLocator: string,
    targetLocator: string,
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const resolvedRoot = this.resolveRoot(root);
    const source = await this.findRawElement(sourceLocator, resolvedRoot, timeoutMs);
    const target = await this.findRawElement(targetLocator, resolvedRoot, timeoutMs);

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

  /** For a browser driver that moves the element and never emits the drop (geckodriver#1450). */
  async dispatchDragEvents(
    sourceLocator: string,
    targetLocator: string,
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const resolvedRoot = this.resolveRoot(root);
    const source = await this.findRawElement(sourceLocator, resolvedRoot, timeoutMs);
    const target = await this.findRawElement(targetLocator, resolvedRoot, timeoutMs);

    await simulateHtml5Drag(this.driver, source, target);
  }

  async getText(
    locator: string,
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<string> {
    const element = await this.findRawElement(locator, this.resolveRoot(root), timeoutMs);
    return element.getText();
  }

  async getAttribute(
    locator: string,
    attributeName: string,
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<string> {
    const element = await this.findRawElement(locator, this.resolveRoot(root), timeoutMs);
    return (await element.getAttribute(attributeName)) ?? "";
  }

  // A miss at timeoutMs 0 is an absence check doing its job, so it is logged at debug; anything
  // else is a locator that was expected to resolve and did not.
  private async reportMiss(locator: string, timeoutMs: number, error: unknown): Promise<void> {
    const url = await this.driver.getCurrentUrl().catch(() => "unknown");
    const details = { locator, url, reason: String(error) };

    if (timeoutMs === 0) logger.debug(details, "Locator absent");
    else logger.warn(details, "Locator never became visible");
  }

  async isVisible(
    locators: string | string[],
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<boolean> {
    const list = Array.isArray(locators) ? locators : [locators];

    if (list.length === 0) return false;

    const resolvedRoot = this.resolveRoot(root);
    // A locator that never resolves is reported with its URL and the reason, then counted as false.
    const results = await Promise.all(
      list.map((locator) =>
        this.findRawElement(locator, resolvedRoot, timeoutMs)
          .then(() => true)
          .catch(async (error: unknown) => {
            await this.reportMiss(locator, timeoutMs, error);
            return false;
          }),
      ),
    );

    return results.every(Boolean);
  }

  // For a condition with no action to pair it with: a suggestion list settles from a query typed in
  // an earlier step, and its entries are text no locator can name. Returns false, never throws.
  async waitUntil(
    predicate: () => Promise<boolean>,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<boolean> {
    return this.driver.wait(predicate, timeoutMs).then(
      () => true,
      () => false,
    );
  }

  // Predicate-based counterpart to actAndWaitFor, for state a locator alone can't express.
  async actAndWaitUntil(
    action: () => Promise<void>,
    predicate: () => Promise<boolean>,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await action();
    await this.driver.wait(predicate, timeoutMs);
  }

  async clickAndWaitUntil(
    clickLocator: string,
    predicate: () => Promise<boolean>,
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
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
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<IElementHandle[]> {
    await action();
    return Promise.all(readyLocators.map((locator) => this.findElement(locator, root, timeoutMs)));
  }

  async clickAndWaitFor(
    clickLocator: string,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<IElementHandle[]> {
    return this.actAndWaitFor(
      () => this.click(clickLocator, root, timeoutMs),
      readyLocators,
      root,
      timeoutMs,
    );
  }

  // For a click whose outcome is a navigation rather than an element: the page that answers it may
  // render nothing the previous one did not already have.
  async clickAndWaitForUrl(
    clickLocator: string,
    urlPattern: RegExp,
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await this.click(clickLocator, root, timeoutMs);
    await this.waitForUrl(
      urlPattern,
      timeoutMs,
      `The browser never reached a URL matching ${urlPattern.toString()}`,
    );
  }

  async getCurrentUrl(): Promise<string> {
    return this.driver.getCurrentUrl();
  }

  async typeAndWaitFor(
    typeLocator: string,
    text: string,
    readyLocators: string[],
    root?: IElementHandle,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<IElementHandle[]> {
    return this.actAndWaitFor(
      () => this.type(typeLocator, text, root, timeoutMs),
      readyLocators,
      root,
      timeoutMs,
    );
  }

  // For an interaction the application saves after it has already changed the screen, which makes
  // that screen no answer at all.
  async reload(readyLocators: string[], timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<void> {
    await this.driver.navigate().refresh();
    await Promise.all(
      readyLocators.map((locator) => this.findElement(locator, undefined, timeoutMs)),
    );
  }

  async open(url: string, readyLocators: string[] = [], timeoutMs?: number): Promise<void> {
    if (readyLocators.length === 0) {
      await this.driver.get(url);
      return;
    }

    await this.actAndWaitFor(() => this.driver.get(url), readyLocators, undefined, timeoutMs);
  }

  async queryAll(locator: string): Promise<IElementHandle[]> {
    const raw = await this.driver.findElements(By.css(locator));
    return raw.map((element) => new SeleniumElementHandle(element));
  }

  async waitFor(
    predicate: () => Promise<boolean>,
    timeoutMs: number,
    message?: string,
  ): Promise<void> {
    await this.driver.wait(predicate, timeoutMs, message);
  }

  async waitForUrl(pattern: RegExp | string, timeoutMs?: number, message?: string): Promise<void> {
    const condition =
      typeof pattern === "string" ? until.urlContains(pattern) : until.urlMatches(pattern);
    await this.driver.wait(condition, timeoutMs, message);
  }

  executeScript<T>(script: (...args: unknown[]) => T, ...args: unknown[]): Promise<T> {
    return this.driver.executeScript<T>(script, ...args);
  }
}
