import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core/selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core/gitea/config";
import { Organization } from "@gitea-automation/core/gitea/entities/organization.entity";

export class OrganizationDashboardPage extends BasePage {
  private readonly organization: Organization;

  private readonly locators = {
    organizationName: By.css(".organization.profile h1"),
    viewRepositoryButton: By.css("a[title^='View test-orgs-']"),
  };

  override getUrl(): string {
    return `${baseUrl}/org/${this.organization.name}/dashboard`;
  }

  constructor(driver: WebDriver, organization: Organization) {
    super(driver);
    this.organization = organization;
  }
}
