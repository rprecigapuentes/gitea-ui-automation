import type { WebDriver } from "selenium-webdriver";
import { DriverFactory } from "../core/drivers/driver.factory";
import { LoginPage } from "../src/pages/login.page";
import { UserClient } from "./api/clients/user.client";
import { IssueClient } from "./api/clients/issue.client";
import { LabelClient } from "./api/clients/label.client";
import { RepositoryClient } from "./api/clients/repository.client";

export class TestContext {
  readonly driver: WebDriver;
  //pages
  readonly loginPage: LoginPage;
  //api clients
  readonly userClient: UserClient;
  readonly repositoryClient: RepositoryClient;
  readonly labelClient: LabelClient;
  readonly issueClient: IssueClient;

  private readonly createdRepositories: string[] = [];

  private constructor(driver: WebDriver) {
    this.driver = driver;

    //pages
    this.loginPage = new LoginPage(driver);
    //api clients
    const baseUrl = process.env.GITEA_BASE_URL!;
    const token = process.env.GITEA_TOKEN!;

    this.userClient = new UserClient(baseUrl, token);
    this.repositoryClient = new RepositoryClient(baseUrl, token);
    this.labelClient = new LabelClient(baseUrl, token);
    this.issueClient = new IssueClient(baseUrl, token);
  }

  static async create(): Promise<TestContext> {
    const driver = await DriverFactory.getDriver();

    return new TestContext(driver);
  }

  async createRepository(name: string): Promise<void> {
    await this.repositoryClient.createRepository(name);
    this.createdRepositories.push(name);
  }

  async dispose(testName: string): Promise<void> {
    const owner = process.env.GITEA_USERNAME!;

    for (const repository of this.createdRepositories) {
      await this.repositoryClient.deleteRepository(owner, repository);
    }
    this.createdRepositories.length = 0;

    console.log(`Cleaning data for test: ${testName}`);
  }
}
