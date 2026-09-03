import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../core/base-pages/base.page";
import { baseUrl } from "../../core/config/config";
import { Organization } from "../entities/organization.entity";

export class OrganizationDashboardPage extends BasePage {
  private readonly organization: Organization;

  private readonly locators = {
    //Improve locator
    viewRepositoryButton: By.css(
      "body > div > div > div.secondary-nav.tw-border-b.tw-border-b-secondary > div > div.right.menu.tw-flex-wrap.tw-justify-end > div > a",
    ),
  };

  override getUrl(): string {
    return `${baseUrl}/org/${this.organization.name}/dashboard`;
  }

  constructor(driver: WebDriver, organization: Organization) {
    super(driver);
    this.organization = organization;
  }

  async clickViewRepositoryButton(): Promise<void> {
    await this.click(this.locators.viewRepositoryButton);
  }
}
