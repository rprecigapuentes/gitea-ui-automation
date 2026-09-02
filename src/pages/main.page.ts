import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../core/base-pages/base.page";

export class MainPage extends BasePage {
  private readonly locators = {
    loggedInUsername: By.css(
      "body > div > div > div.secondary-nav.tw-border-b.tw-border-b-secondary > div > div > div > span > span.gt-ellipsis",
    ),
    newDropdown: By.xpath("/html/body/div/nav/div[2]/div[1]"),
    newOrganization: By.id("_aria_dropdown_item_4"),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  async getLoggedInUsername(): Promise<string> {
    return (await this.find(this.locators.loggedInUsername)).getText();
  }

  async navigateCreateOrganization(): Promise<void> {
    await this.click(this.locators.newDropdown);
    await this.click(this.locators.newOrganization);
  }
}
