import { WebDriver, By, WebElement, until, error as seleniumError } from "selenium-webdriver";
import { logger } from "../../../logger/pino.logger";
import { simulateHtml5Drag } from "../utils/html5-drag.util";
import { renameClass } from "../utils/markup-drift.util";

export type SearchRoot = WebDriver | WebElement;

const DEFAULT_TIMEOUT_MS = 5000;
const DRAG_THRESHOLD_PX = 5;
const DRAG_STEP_PX = 20;
const DRAG_PAUSE_MS = 200;

export interface Verifiable {
  isVisible(locators: By | By[], root?: SearchRoot, timeoutMs?: number): Promise<boolean>;
}

// The healing proxy answers concurrent lookups on one session from a single shared context, so
// two sent together can come back swapped or empty. One lookup at a time per driver; only the
// lookup itself, never the wait around it.
const lookupTails = new WeakMap<WebDriver, Promise<unknown>>();

async function lookUp(driver: WebDriver, root: SearchRoot, locator: By): Promise<WebElement[]> {
  const previous = lookupTails.get(driver) ?? Promise.resolve();
  const current = previous.then(() => root.findElements(locator));
  lookupTails.set(
    driver,
    current.catch(() => undefined),
  );
  return current;
}

export abstract class BaseComponent implements Verifiable {
  constructor(protected driver: WebDriver) {}

  protected async findElements(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement[]> {
    // Chrome can drop the CDP node of an element the session still holds while the screen mutates
    // under the poll (unhandled inspector error). The read is transient, so it retries.
    const checkOnce = async (): Promise<WebElement[] | null> => {
      try {
        const found = await lookUp(this.driver, root, locator);
        if (found.length === 0) return null;
        const visible = await Promise.all(found.map((element) => element.isDisplayed()));
        return visible.every(Boolean) ? found : null;
      } catch (error) {
        // Drivers with real element references report the stale read; Chrome drops the CDP node
        // and answers an unhandled inspector error. Both are transient: the wait retries them.
        if (
          error instanceof seleniumError.StaleElementReferenceError ||
          (error instanceof seleniumError.WebDriverError &&
            error.message.includes("unhandled inspector error"))
        ) {
          logger.debug({ locator: locator.toString() }, "Retrying a transient element error");
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

  /** Both ends resolve here, so a caller that re-read the screen cannot drag a stale element. */
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

  /** For a browser driver that moves the element and never emits the drop (geckodriver#1450). */
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

  /** Makes the screen drift under a locator: the elements stay, the class they were found by does not. */
  async renameClass(
    locator: By,
    from: string,
    to: string,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    const elements = await this.findElements(locator, root, timeoutMs);
    await renameClass(this.driver, elements, from, to);
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

  // A miss at timeoutMs 0 is an absence check doing its job, so it is logged at debug; anything
  // else is a locator that was expected to resolve and did not.
  private async reportMiss(locator: By, timeoutMs: number, error: unknown): Promise<void> {
    const url = await this.driver.getCurrentUrl().catch(() => "unknown");
    const details = { locator: locator.toString(), url, reason: String(error) };

    if (timeoutMs === 0) logger.debug(details, "Locator absent");
    else logger.warn(details, "Locator never became visible");
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
          .catch(async (error: unknown) => {
            await this.reportMiss(locator, timeoutMs, error);
            return false;
          }),
      ),
    );

    return results.every(Boolean);
  }

  // actAndWaitUntil covers a condition that follows an action. This is for one that does not: a
  // suggestion list settles from a query typed in an earlier step, so there is no action here to
  // pair the wait with, and the entries carry their identity as text, which no locator can name.
  // Reports rather than raises, so a check built on it stays a boolean for its caller.
  protected async waitUntil(
    predicate: () => Promise<boolean>,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<boolean> {
    return this.driver.wait(predicate, timeoutMs).then(
      () => true,
      () => false,
    );
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

  async getCurrentUrl(): Promise<string> {
    return this.driver.getCurrentUrl();
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

  // For an interaction the application saves after it has already changed the screen, which makes
  // that screen no answer at all.
  protected async reload(
    readyLocators: By[],
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await this.driver.navigate().refresh();
    await Promise.all(
      readyLocators.map((locator) => this.findElement(locator, this.driver, timeoutMs)),
    );
  }
}
