import type { WebDriver } from "selenium-webdriver";
import { DriverFactory } from "../core/drivers/driver.factory";
import type { Organization } from "./entities/organization.entity";
import { LoginPage } from "../src/pages/login.page";
import { MainPage } from "../src/pages/main.page";
import { CreateOrganizationPage } from "../src/pages/create-organization.page";
import { OrganizationDashboardPage } from "../src/pages/organization-dashboard.page";
import { OrganizationRepositoriesPage } from "../src/pages/organization-repositories.page";
import { UserClient } from "./api/clients/user.client";
import { OrganizationClient } from "./api/clients/organizations.client";
import { OrganizationTeamsPage } from "./pages/organization-teams.page";

export class TestContext {
  readonly driver: WebDriver;
  //pages
  readonly loginPage: LoginPage;
  readonly mainPage: MainPage;
  readonly createOrganizationPage: CreateOrganizationPage;
  readonly organizationDashboardPage: OrganizationDashboardPage;
  readonly organizationRepositoriesPage: OrganizationRepositoriesPage;
  readonly organizationTeamsPage: OrganizationTeamsPage;
  //api clients
  readonly userClient: UserClient;
  readonly organizationClient: OrganizationClient;
  //entities
  organization?: Organization;

  private constructor(driver: WebDriver) {
    this.driver = driver;
    //pages
    this.loginPage = new LoginPage(driver);
    this.mainPage = new MainPage(driver);
    this.createOrganizationPage = new CreateOrganizationPage(driver);
    this.organizationDashboardPage = new OrganizationDashboardPage(driver, this.organization!);
    this.organizationRepositoriesPage = new OrganizationRepositoriesPage(
      driver,
      this.organization!,
    );
    this.organizationTeamsPage = new OrganizationTeamsPage(driver, this.organization!);
    //api clients
    this.userClient = new UserClient(process.env.GITEA_BASE_URL!, process.env.GITEA_TOKEN!);
    this.organizationClient = new OrganizationClient(
      process.env.GITEA_BASE_URL!,
      process.env.GITEA_TOKEN!,
    );
  }

  static async create(): Promise<TestContext> {
    const driver = await DriverFactory.getDriver();
    return new TestContext(driver);
  }

  async dispose(testName: string): Promise<void> {
    if (this.organization) {
      await this.organizationClient.deleteOrganization(this.organization.name);
    }
    console.log(`Cleaning data for test: ${testName}`);
  }
}
