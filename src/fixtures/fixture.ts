/* eslint-disable no-empty-pattern */
import { test as base } from "vitest";
import { UserClient } from "../api/clients/user.client";
import { OrganizationClient } from "../api/clients/organizations.client";
import { RepositoryClient } from "../api/clients/repository.client";
import { LabelClient } from "../api/clients/label.client";
import { IssueClient } from "../api/clients/issue.client";
import { Organization } from "../entities/organization.entity";
import { WebDriver } from "selenium-webdriver";
import { DriverFactory } from "../../core/drivers/driver.factory";
import { LoginPage } from "../ui/pages/authentication/login.page";
import { MainPage } from "../ui/pages/main.page";
import { CreateOrganizationPage } from "../ui/pages/organizations/create-organization.page";
import { OrganizationDashboardPage } from "../ui/pages/organizations/organization-dashboard.page";
import { OrganizationRepositoriesPage } from "../ui/pages/organizations/organization-repositories.page";
import { OrganizationTeamsPage } from "../ui/pages/organizations/organization-teams.page";
import { IssuePage } from "../ui/pages/issues/issue.page";
import { IssueListPage } from "../ui/pages/issues/issue-list.page";

interface ScenarioState {
  organization?: Organization;
}

interface ScopedLabels {
  priorityHigh: number;
  priorityLow: number;
  kindBug: number;
}

interface SeededIssue {
  number: number;
  title: string;
}

interface CustomFixtures {
  driver: WebDriver;
  scenarioState: ScenarioState;
  //clients
  userClient: UserClient;
  organizationClient: OrganizationClient;
  repositoryClient: RepositoryClient;
  labelClient: LabelClient;
  issueClient: IssueClient;
  //pages
  loginPage: LoginPage;
  mainPage: MainPage;
  createOrganizationPage: CreateOrganizationPage;
  organizationPages: {
    dashboard: () => OrganizationDashboardPage;
    repositories: () => OrganizationRepositoriesPage;
    teams: () => OrganizationTeamsPage;
  };
  issuePage: IssuePage;
  issueListPage: IssueListPage;
  //entities
  scopedLabels: ScopedLabels;
  issue: SeededIssue;
  repository: string;
  //cleanup
  cleanupOrganizations: void;
}

export const test = base.extend<CustomFixtures>({
  driver: [
    async ({}, use) => {
      const driver = await DriverFactory.getDriver();
      await use(driver);
      await DriverFactory.quitDriver();
    },
    { scope: "file" },
  ],
  scenarioState: async ({}, use) => {
    const scenarioState: ScenarioState = {};
    await use(scenarioState);
  },
  userClient: async ({}, use) => {
    const userClient = new UserClient(process.env.GITEA_BASE_URL!, process.env.GITEA_TOKEN!);
    await use(userClient);
  },
  organizationClient: async ({}, use) => {
    const organizationClient = new OrganizationClient(
      process.env.GITEA_BASE_URL!,
      process.env.GITEA_TOKEN!,
    );
    await use(organizationClient);
  },
  repositoryClient: async ({}, use) => {
    await use(new RepositoryClient(process.env.GITEA_BASE_URL!, process.env.GITEA_TOKEN!));
  },
  labelClient: async ({}, use) => {
    await use(new LabelClient(process.env.GITEA_BASE_URL!, process.env.GITEA_TOKEN!));
  },
  issueClient: async ({}, use) => {
    await use(new IssueClient(process.env.GITEA_BASE_URL!, process.env.GITEA_TOKEN!));
  },
  issuePage: async ({ driver }, use) => {
    const issuePage = new IssuePage(driver);
    await use(issuePage);
  },
  issueListPage: async ({ driver }, use) => {
    const issueListPage = new IssueListPage(driver);
    await use(issueListPage);
  },
  loginPage: async ({ driver }, use) => {
    const loginPage = new LoginPage(driver);
    await use(loginPage);
  },
  mainPage: async ({ driver }, use) => {
    const mainPage = new MainPage(driver);
    await use(mainPage);
  },
  createOrganizationPage: async ({ driver }, use) => {
    const createOrganizationPage = new CreateOrganizationPage(driver);
    await use(createOrganizationPage);
  },
  organizationPages: async ({ driver, scenarioState }, use) => {
    const requireOrganization = (): Organization => {
      if (!scenarioState.organization) {
        throw new Error("organization is not set in scenarioState");
      }
      return scenarioState.organization;
    };

    await use({
      dashboard: () => new OrganizationDashboardPage(driver, requireOrganization()),
      repositories: () => new OrganizationRepositoriesPage(driver, requireOrganization()),
      teams: () => new OrganizationTeamsPage(driver, requireOrganization()),
    });
  },
  cleanupOrganizations: [
    async ({ organizationClient, scenarioState, task }, use) => {
      await use();
      const organization = scenarioState.organization;
      if (!organization) return;

      console.log(`Cleaning data for test: ${task.name}`);
      await organizationClient.deleteOrganization(organization.name);
    },
    { auto: true },
  ],
  repository: async ({ repositoryClient }, use) => {
    const owner = process.env.GITEA_USERNAME!;
    const name = `test-issues-${Date.now()}-${process.env.BROWSER ?? "local"}`;

    await repositoryClient.createRepository(name);
    await use(name);
    await repositoryClient.deleteRepository(owner, name);
  },
  scopedLabels: async ({ labelClient, repository }, use) => {
    const owner = process.env.GITEA_USERNAME!;
    const createLabel = async (name: string, color: string): Promise<number> => {
      const response = await labelClient.createLabel(owner, repository, {
        name,
        color,
        exclusive: true,
      });

      return response.body.id;
    };

    await use({
      priorityHigh: await createLabel("priority/high", "#d73a4a"),
      priorityLow: await createLabel("priority/low", "#0e8a16"),
      kindBug: await createLabel("kind/bug", "#1d76db"),
    });
  },
  issue: async ({ issueClient, repository }, use) => {
    const owner = process.env.GITEA_USERNAME!;
    const title = "Scoped labels acceptance";
    const response = await issueClient.createIssue(owner, repository, title);

    await use({ number: response.body.number, title });
  },
});
