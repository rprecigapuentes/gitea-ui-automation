/* eslint-disable no-empty-pattern */
import { test as base } from "vitest";
import * as allure from "allure-js-commons";
import { ContentType } from "allure-js-commons";
import { UserClient } from "../api/clients/user.client";
import { OrganizationClient } from "../api/clients/organizations.client";
import { RepositoryClient } from "../api/clients/repository.client";
import { LabelClient } from "../api/clients/label.client";
import { IssueClient } from "../api/clients/issue.client";
import { MilestoneClient } from "../api/clients/milestone.client";
import { Organization } from "../entities/organization.entity";
import { ScopedLabels, SeededLabel } from "../entities/label.entity";
import { SeededMilestone } from "../entities/milestone.entity";
import { User } from "../entities/user.entity";
import { SeededIssue } from "../entities/issue.entity";
import { testDataName } from "../../core/utils/test-data.util";
import { BrowserStackSession } from "../entities/browserstack.entity";
import { ScenarioState } from "../entities/scenario.entity";
import { BrowserSession } from "../entities/session.entity";
import { WebDriver } from "selenium-webdriver";
import { DriverFactory } from "../../core/drivers/driver.factory";
import { LoginPage } from "../ui/pages/authentication/login.page";
import { MainPage } from "../ui/pages/main.page";
import { CreateOrganizationPage } from "../ui/pages/organizations/create-organization.page";
import { OrganizationDashboardPage } from "../ui/pages/organizations/organization-dashboard.page";
//Org Fragments
import { OrgRepositoriesFragment } from "../ui/pages/organizations/fragments/org-repositories.fragment";
import { OrgTeamsFragment } from "../ui/pages/organizations/fragments/org-teams.fragment";
import { OrgNavigationFragment } from "../ui/pages/organizations/fragments/org-navigation.fragment";
//Org facade
import { OrganizationFacade } from "../ui/pages/organizations/facade/organization.facade";
import { IssuePage } from "../ui/pages/issues/issue.page";
import { IssueListPage } from "../ui/pages/issues/issue-list.page";
import { AuthClient } from "../api/clients/auth.client";
import { isBrowserStack, setSessionStatus } from "../../core/config/browserstack.config";
import { LabelListPage } from "../ui/pages/issues/label-list.page";
import { CreateIssuePage } from "../ui/pages/issues/create-issue.page";
import { MilestoneListPage } from "../ui/pages/issues/milestone-list.page";

interface CustomFixtures {
  driver: WebDriver;
  browserstackSession: BrowserStackSession;
  browserstackStatus: void;
  screenshotOnFailure: void;
  scenarioState: ScenarioState;
  authClient: AuthClient;
  skipAutoLogin: boolean;
  session: BrowserSession;
  loggedInSession: void;
  //clients
  userClient: UserClient;
  organizationClient: OrganizationClient;
  repositoryClient: RepositoryClient;
  labelClient: LabelClient;
  issueClient: IssueClient;
  milestoneClient: MilestoneClient;
  //pages
  loginPage: LoginPage;
  mainPage: MainPage;
  createOrganizationPage: CreateOrganizationPage;
  organizationPages: {
    dashboard: () => OrganizationDashboardPage;
    navigation: () => OrgNavigationFragment;
    repositories: () => OrgRepositoriesFragment;
    teams: () => OrgTeamsFragment;
    orgFacade: () => OrganizationFacade;
  };
  issuePage: IssuePage;
  issueListPage: IssueListPage;
  labelListPage: LabelListPage;
  createIssuePage: CreateIssuePage;
  milestoneListPage: MilestoneListPage;
  //entities
  scopedLabels: ScopedLabels;
  issue: SeededIssue;
  repository: string;
  maintainer: User;
  classificationLabel: SeededLabel;
  milestone: SeededMilestone;
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
  screenshotOnFailure: [
    async ({ driver, task, onTestFailed }, use) => {
      onTestFailed(async () => {
        try {
          const currentUrl = await driver.getCurrentUrl();
          const screenshot = await driver.takeScreenshot();
          await allure.attachment(
            `Screenshot - ${task.name} - ${currentUrl} - ${new Date().toISOString()}`,
            Buffer.from(screenshot, "base64"),
            ContentType.PNG,
          );
        } catch (err) {
          console.warn(`Failed to capture screenshot for test ${task.name}:`, err);
        }
      });

      await use();
    },
    { auto: true },
  ],
  authClient: async ({}, use) => {
    await use(new AuthClient(process.env.GITEA_BASE_URL!));
  },
  skipAutoLogin: async ({}, use) => {
    await use(false);
  },
  session: async ({ driver, authClient }, use) => {
    await use({
      loginAs: async (username: string, password: string) => {
        await driver.get(process.env.GITEA_BASE_URL!);

        const browserUserAgent = await driver.executeScript("return navigator.userAgent;");
        const cookies = await authClient.loginViaApi(
          username,
          password,
          browserUserAgent as string,
        );
        await driver.manage().deleteAllCookies();

        for (const cookie of cookies) {
          await driver.manage().addCookie({
            name: cookie.name,
            value: cookie.value,
            path: cookie.path || "/",
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
          });
        }

        await driver.navigate().refresh();
      },
    });
  },
  loggedInSession: [
    async ({ session, skipAutoLogin }, use) => {
      if (!skipAutoLogin) {
        await session.loginAs(process.env.GITEA_USERNAME!, process.env.GITEA_PASSWORD!);
      }

      await use();
    },
    { auto: true },
  ],
  browserstackSession: [
    async ({ driver }, use) => {
      const session = { failed: false };
      await use(session);

      if (!isBrowserStack) return;

      await setSessionStatus(
        driver,
        session.failed ? "failed" : "passed",
        session.failed ? "a test in this file failed" : "every test in this file passed",
      );
    },
    { scope: "file", auto: true },
  ],
  browserstackStatus: [
    async ({ browserstackSession, onTestFailed }, use) => {
      onTestFailed(() => {
        browserstackSession.failed = true;
      });

      await use();
    },
    { auto: true },
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
  labelListPage: async ({ driver }, use) => {
    await use(new LabelListPage(driver));
  },
  issueClient: async ({}, use) => {
    await use(new IssueClient(process.env.GITEA_BASE_URL!, process.env.GITEA_TOKEN!));
  },
  milestoneClient: async ({}, use) => {
    await use(new MilestoneClient(process.env.GITEA_BASE_URL!, process.env.GITEA_TOKEN!));
  },
  createIssuePage: async ({ driver }, use) => {
    await use(new CreateIssuePage(driver));
  },
  milestoneListPage: async ({ driver }, use) => {
    await use(new MilestoneListPage(driver));
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

    let dashboard: OrganizationDashboardPage | undefined;
    let navigation: OrgNavigationFragment | undefined;
    let repositories: OrgRepositoriesFragment | undefined;
    let teams: OrgTeamsFragment | undefined;
    let facade: OrganizationFacade | undefined;

    await use({
      dashboard: () => (dashboard ??= new OrganizationDashboardPage(driver, requireOrganization())),
      navigation: () => (navigation ??= new OrgNavigationFragment(driver)),
      repositories: () => (repositories ??= new OrgRepositoriesFragment(driver)),
      teams: () => (teams ??= new OrgTeamsFragment(driver)),
      orgFacade: () =>
        (facade ??= new OrganizationFacade(
          driver,
          requireOrganization(),
          (navigation ??= new OrgNavigationFragment(driver)),
          (repositories ??= new OrgRepositoriesFragment(driver)),
          (teams ??= new OrgTeamsFragment(driver)),
        )),
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
  maintainer: async ({ userClient }, use) => {
    await use((await userClient.getUser()).body);
  },
  classificationLabel: async ({ labelClient, repository }, use) => {
    const owner = process.env.GITEA_USERNAME!;
    const name = testDataName("ISS-01", "Label");
    const response = await labelClient.createLabel(owner, repository, {
      name,
      color: "#5319e7",
      exclusive: false,
    });

    await use({ id: response.body.id, name });
  },
  milestone: async ({ milestoneClient, repository }, use) => {
    const owner = process.env.GITEA_USERNAME!;
    const title = testDataName("ISS-01", "Milestone");
    const description = "Milestone the created issue has to advance when it is closed";
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const response = await milestoneClient.createMilestone(owner, repository, {
      title,
      description,
      due_on: dueDate.toISOString(),
    });

    await use({ id: response.body.id, title, description, dueDate });
  },
  issue: async ({ issueClient, repository }, use) => {
    const owner = process.env.GITEA_USERNAME!;
    const title = "Scoped labels acceptance";
    const response = await issueClient.createIssue(owner, repository, title);

    await use({ number: response.body.number, title });
  },
});
