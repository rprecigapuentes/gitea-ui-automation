import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "./base.page";

export class MainPage extends BasePage {
  private readonly locators = {
    loggedInUsername: By.xpath("/html/body/div/div/div[1]/div/div/div/span/span[1]"),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  async getLoggedInUsername(): Promise<string> {
    return (await this.find(this.locators.loggedInUsername)).getText();
  }
}
