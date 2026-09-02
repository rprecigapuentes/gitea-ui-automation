import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../core/base-pages/base.page";

export class CreateOrganizationPage extends BasePage {
  private readonly locators = {
    formTitle: By.css("body > div > div > div > h3"),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  async getFormTitle(): Promise<string> {
    return (await this.find(this.locators.formTitle)).getText();
  }
}
