import { WebDriver, By, WebElement, until } from "selenium-webdriver";

const DEFAULT_TIMEOUT_MS = 5000;

export abstract class BaseComponent {
  constructor(protected driver: WebDriver) {}

  async find(locator: By, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<WebElement> {
    const element = await this.driver.wait(until.elementLocated(locator), timeoutMs);
    return this.driver.wait(until.elementIsVisible(element), timeoutMs);
  }

  async click(locator: By, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<void> {
    const element = await this.find(locator, timeoutMs);
    await element.click();
  }

  async type(locator: By, text: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<void> {
    const element = await this.find(locator, timeoutMs);
    await element.sendKeys(text);
  }
}
