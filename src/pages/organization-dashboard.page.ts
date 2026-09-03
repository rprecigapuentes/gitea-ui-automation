import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../core/base-pages/base.page";
import { baseUrl } from "../../core/config/config";

export class OrganizationPage extends BasePage {
  private readonly locators = {
    viewOrganizationButton: By.css(
      "body > div > div > div.secondary-nav.tw-border-b.tw-border-b-secondary > div > div.right.menu.tw-flex-wrap.tw-justify-end > div > a",
    ),
  };

  override getUrl(organizationName: string): string {
    return `${baseUrl}/org/${organizationName}/dashboard`;
  }

  constructor(driver: WebDriver) {
    super(driver);
  }

  async clickViewOrganizationButton(): Promise<void> {
    await this.click(this.locators.viewOrganizationButton);
  }
}
