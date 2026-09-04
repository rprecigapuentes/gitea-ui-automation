import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../../../core/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";
import { Organization } from "../../../entities/organization.entity";

export class OrganizationDashboardPage extends BasePage {
  private readonly organization: Organization;

  private readonly locators = {
    viewRepositoryButton: By.css("a[title^='View test-orgs-']"),
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
