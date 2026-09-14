import { WebDriver, By, WebElement, until } from "selenium-webdriver";

export type SearchRoot = WebDriver | WebElement;

const DEFAULT_TIMEOUT_MS = 5000;

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

  // For state a locator alone can't express (e.g. a button's disabled attribute).
  protected async waitUntil(
    predicate: () => Promise<boolean>,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await this.driver.wait(predicate, timeoutMs);
  }

  // Predicate-based counterpart to actAndWaitFor, for state a locator alone can't express.
  protected async actAndWaitUntil(
    action: () => Promise<void>,
    predicate: () => Promise<boolean>,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await action();
    await this.waitUntil(predicate, timeoutMs);
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
}
