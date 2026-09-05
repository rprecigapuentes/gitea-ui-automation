import { WebDriver, By, WebElement, until } from "selenium-webdriver";
import { logger } from "../../logging/pino.logger";

type SearchRoot = WebDriver | WebElement;

export abstract class BaseComponent {
  constructor(protected driver: WebDriver) {}

  protected async findElement(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = 5000,
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
    timeoutMs: number = 5000,
  ): Promise<WebElement[]> {
    const elements = (await this.driver.wait(async () => {
      const found = await root.findElements(locator);
      return found.length > 0 ? found : null;
    }, timeoutMs)) as WebElement[];

    await Promise.all(
      elements.map((element) => this.driver.wait(until.elementIsVisible(element), timeoutMs)),
    );

    return elements;
  }

  async click(
    locator: By,
    root: SearchRoot = this.driver,
    timeoutMs: number = 5000,
  ): Promise<void> {
    const element = await this.findElement(locator, root, timeoutMs);
    await element.click();
  }

  async type(
    locator: By,
    text: string,
    root: SearchRoot = this.driver,
    timeoutMs: number = 5000,
  ): Promise<void> {
    const element = await this.findElement(locator, root, timeoutMs);
    await element.sendKeys(text);
  }
}
