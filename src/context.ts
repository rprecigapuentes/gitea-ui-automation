import type { WebDriver } from "selenium-webdriver";
import { DriverFactory } from "../core/drivers/driver.factory";
import { LoginPage } from "../src/pages/login.page";
import { MainPage } from "../src/pages/main.page";
import { CreateOrganizationPage } from "../src/pages/create-organization.page";
import { OrganizationPage } from "../src/pages/organization.page";
import { UserClient } from "./api/clients/user.client";
import { OrganizationClient } from "./api/clients/organizations.client";

export class TestContext {
  readonly driver: WebDriver;
  //pages
  readonly loginPage: LoginPage;
  readonly mainPage: MainPage;
  readonly createOrganizationPage: CreateOrganizationPage;
  readonly organizationPage: OrganizationPage;
  //api clients
  readonly userClient: UserClient;
  readonly organizationClient: OrganizationClient;

  private constructor(driver: WebDriver) {
    this.driver = driver;
    //pages
    this.loginPage = new LoginPage(driver);
    this.mainPage = new MainPage(driver);
    this.createOrganizationPage = new CreateOrganizationPage(driver);
    this.organizationPage = new OrganizationPage(driver);
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
    const response = await this.organizationClient.getAllOrganizations();
    expect(response.statusCode).toBe(200);
    const orgs = response.body;

    await Promise.all(orgs.map((org) => this.organizationClient.deleteOrganization(org.name)));
    console.log(`Cleaning data for test: ${testName}`);
  }
}
