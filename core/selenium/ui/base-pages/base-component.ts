import { WebDriver, By, WebElement, until } from "selenium-webdriver";
import { logger } from "@gitea-automation/core-logger/pino.logger";

type SearchRoot = WebDriver | WebElement;

const DEFAULT_TIMEOUT_MS = 5000;

export abstract class BaseComponent {
  constructor(protected driver: WebDriver) {}

  protected async findElement(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement> {
    const elements = await this.findElements(locator, root, timeoutMs);

    if (elements.length !== 1) {
      const message = `Expected exactly 1 element for locator "${locator.toString()}", but found ${elements.length}`;
      const matchedElements = await Promise.all(
        elements.map(async (element) =>
          ((await element.getAttribute("outerHTML")) ?? "").slice(0, 500),
        ),
      );
      logger.error(
        { locator: locator.toString(), matches: elements.length, matchedElements },
        message,
      );
      throw new Error(message);
    }

    return elements[0];
  }

  protected async findElements(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement[]> {
    const locatorText = locator.toString();
    let phase = "presence";
    let matches = 0;

    logger.debug({ locator: locatorText, timeoutMs }, "Waiting for element locator");

    try {
      const elements = (await this.driver.wait(async () => {
        const found = await root.findElements(locator);
        matches = found.length;
        return found.length > 0 ? found : null;
      }, timeoutMs)) as WebElement[];

      phase = "visibility";
      await Promise.all(
        elements.map((element) => this.driver.wait(until.elementIsVisible(element), timeoutMs)),
      );

      logger.debug({ locator: locatorText, matches }, "Element locator is visible");
      return elements;
    } catch (error) {
      const url = await this.driver.getCurrentUrl().catch(() => "unavailable");
      const title = await this.driver.getTitle().catch(() => "unavailable");
      const pageText = await this.driver
        .executeScript("return document.body?.innerText?.slice(0, 1000) ?? '';")
        .catch(() => "unavailable");
      logger.error(
        {
          locator: locatorText,
          matches,
          phase,
          timeoutMs,
          url,
          title,
          pageText,
          error: error instanceof Error ? error.message : String(error),
        },
        "Element lookup failed",
      );
      throw error;
    }
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

  async exists(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<boolean> {
    try {
      await this.findElement(locator, root, timeoutMs);
      logger.info(
        { locator: locator.toString() },
        `Element exists for locator "${locator.toString()}"`,
      );
      return true;
    } catch {
      logger.warn(
        { locator: locator.toString() },
        `Element does not exist for locator "${locator.toString()}"`,
      );
      return false;
    }
  }

  async doesNotExist(locator: By, root: SearchRoot = this.driver): Promise<boolean> {
    const matches = await root.findElements(locator);
    const doesNotExist = matches.length === 0;

    logger.debug(
      { locator: locator.toString(), matches: matches.length },
      doesNotExist ? "Element is absent" : "Element is present",
    );

    return doesNotExist;
  }

  async getText(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<string> {
    const element = await this.findElement(locator, root, timeoutMs);
    return element.getText();
  }

  //Equivalent to custom wait, make the action and wait for the specified elements to be ready
  protected async actAndWaitFor(
    action: () => Promise<void>,
    readyLocators: By[],
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement[]> {
    logger.info(
      { readyLocators: readyLocators.map((locator) => locator.toString()) },
      "Waiting for elements to be ready after action",
    );

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

  async getAttribute(
    locator: By,
    attributeName: string,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<string> {
    const element = await this.findElement(locator, root, timeoutMs);
    return (await element.getAttribute(attributeName)) ?? "";
  }
}
