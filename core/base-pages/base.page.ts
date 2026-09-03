import { WebDriver, Locator, WebElement, until } from "selenium-webdriver";

export abstract class BasePage {
  protected constructor(protected readonly driver: WebDriver) {}

  abstract getUrl(...args: unknown[]): string;

  //Timeout should be configured as implicit timeout in selenium when creating the driver, 
  //make possible to pass a optional variable to set the explicit time if necesary
  protected async find(locator: Locator): Promise<WebElement> {
    await this.driver.wait(until.elementLocated(locator), 10000);
    return this.driver.findElement(locator);
  }

  protected async click(locator: Locator): Promise<void> {
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
