import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "./base.page";

export class MainPage extends BasePage {
  private readonly locators = {
    loggedInUsername: By.css(
      "body > div > div > div.secondary-nav.tw-border-b.tw-border-b-secondary > div > div > div > span > span.gt-ellipsis",
    ),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  async getLoggedInUsername(): Promise<string> {
    return (await this.find(this.locators.loggedInUsername)).getText();
  }
}
