import { WebDriver, Locator, WebElement, until } from "selenium-webdriver";
import { logger } from "../logging/pino.logger";

export abstract class BasePage {
  protected constructor(protected readonly driver: WebDriver) {}

  abstract getUrl(...args: unknown[]): string;

  protected async find(locator: Locator): Promise<WebElement> {
    await this.driver.wait(until.elementLocated(locator), 10000);
    return this.driver.findElement(locator);
  }

  protected async click(locator: Locator): Promise<void> {
    logger.debug({ locator: locator }, "click");
    const element = await this.find(locator);
    await this.driver.wait(until.elementIsVisible(element), 10000);
    await element.click();
  }

  protected async type(locator: Locator, text: string): Promise<void> {
    const element = await this.find(locator);
    await this.driver.wait(until.elementIsVisible(element), 10000);
    await element.sendKeys(text);
  }
}
