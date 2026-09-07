import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";
import { Organization } from "../../../entities/organization.entity";

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
