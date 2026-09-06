import { WebDriver, By, WebElement, until } from "selenium-webdriver";
import { logger } from "../../logging/pino.logger";

type SearchRoot = WebDriver | WebElement;

/**
 * The driver carries a 3000 ms implicit wait, so a poll that matches nothing costs three seconds
 * inside findElements and a 5000 ms budget buys barely two attempts. Ten seconds is what the
 * explicit waits in the page objects already use and what a page under three parallel browsers
 * needs.
 */
const DEFAULT_TIMEOUT_MS = 10000;

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
      logger.error({ locator: locator.toString(), matches: elements.length }, message);
      throw new Error(message);
    }

    return elements[0];
  }

  protected async findElements(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<WebElement[]> {
    const elements = (await this.driver.wait(async () => {
      const found = await root.findElements(locator);
      return found.length > 0 ? found : null;
    }, timeoutMs)) as WebElement[];

    await Promise.all(
      elements.map((element) =>
        this.driver.wait(
          until.elementIsVisible(element),
          timeoutMs,
          `An element matching "${locator.toString()}" never became visible`,
        ),
      ),
    );

    return elements;
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
}
