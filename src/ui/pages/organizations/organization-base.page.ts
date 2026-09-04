// organization-base.page.ts
import { WebDriver, By } from "selenium-webdriver";
import { BasePage } from "../../../../core/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";
import { Organization } from "../../../entities/organization.entity";

export abstract class OrganizationBasePage extends BasePage {
  protected readonly organization: Organization;

  private readonly navLocators = {
    reposTab: By.css("[data-text='Repositories']"),
    teamsTab: By.css("[data-text='Teams']"),
  };

  constructor(driver: WebDriver, organization: Organization) {
    super(driver);
    this.organization = organization;
  }

  protected get baseOrgUrl(): string {
    return `${baseUrl}/org/${this.organization.name}`;
  }

  async navigateToRepos(): Promise<void> {
    await this.click(this.navLocators.reposTab);
  }

  async navigateToTeams(): Promise<void> {
    await this.click(this.navLocators.teamsTab);
  }
}
