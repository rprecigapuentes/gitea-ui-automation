import { WebDriver, By, WebElement, until } from "selenium-webdriver";

export abstract class BaseComponent {
  constructor(protected driver: WebDriver) {}

  async find(locator: By, timeoutMs = 5000): Promise<WebElement> {
    const element = await this.driver.wait(until.elementLocated(locator), timeoutMs);
    return this.driver.wait(until.elementIsVisible(element), timeoutMs);
  }

  async click(locator: By): Promise<void> {
    const element = await this.find(locator);
    await element.click();
  }

  async type(locator: By, text: string): Promise<void> {
    const element = await this.find(locator);
    await element.sendKeys(text);
  }
}
