import type { WebDriver } from "selenium-webdriver";
import { DriverFactory } from "../core/drivers/driver.factory";
import { LoginPage } from "../src/pages/login.page";
import { MainPage } from "../src/pages/main.page";
import { CreateOrganizationPage } from "../src/pages/create-organization.page";
import { UserClient } from "./api/clients/user.client";

export class TestContext {
  readonly driver: WebDriver;
  //pages
  readonly loginPage: LoginPage;
  readonly mainPage: MainPage;
  readonly createOrganizationPage: CreateOrganizationPage;
  //api clients
  readonly userClient: UserClient;

  private constructor(driver: WebDriver) {
    this.driver = driver;
    //pages
    this.loginPage = new LoginPage(driver);
    this.mainPage = new MainPage(driver);
    this.createOrganizationPage = new CreateOrganizationPage(driver);
    //api clients
    this.userClient = new UserClient(process.env.GITEA_BASE_URL!, process.env.GITEA_TOKEN!);
  }

  static async create(): Promise<TestContext> {
    const driver = await DriverFactory.getDriver();
    return new TestContext(driver);
  }

  dispose(testName: string): void {
    console.log(`Cleaning data for test: ${testName}`);
  }
}
