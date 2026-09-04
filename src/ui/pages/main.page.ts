import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../core/config/config";

export class MainPage extends BasePage {
  private readonly locators = {
    loggedInUsername: By.css(".text span.gt-ellipsis"),
    newDropdown: By.css("[aria-label='Create…']"),
    newOrganization: By.id("_aria_dropdown_item_4"),
  };

  override getUrl(): string {
    return `${baseUrl}/`;
  }

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
