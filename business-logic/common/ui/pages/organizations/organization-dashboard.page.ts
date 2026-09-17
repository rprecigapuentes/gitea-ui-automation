import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
import { Organization } from "@gitea-automation/business-logic-selenium/api/entities/organization.entity";

export class OrganizationDashboardPage extends BasePage {
  protected organization: Organization | undefined;

  private readonly locators = {
    repositoriesContainer: By.css(".dashboard-repos"),
  };

  override getUrl(): string {
    return `${baseUrl}/org/${this.organization?.name}/dashboard`;
  }

  constructor(driver: WebDriver) {
    super(driver);
  }

  async waitForElements(organization: Organization): Promise<void> {
    this.organization = organization;
    await this.isVisible(this.locators.repositoriesContainer);
  }
}
