import { test as base } from "vitest";
import * as allure from "allure-js-commons";
import { ContentType } from "allure-js-commons";
import { UserClient } from "@gitea-automation/business-logic-selenium/api/clients/user.client";
import { OrganizationClient } from "@gitea-automation/business-logic-selenium/api/clients/organizations.client";
import { RepositoryClient } from "@gitea-automation/business-logic-selenium/api/clients/repository.client";
import { LabelClient } from "@gitea-automation/business-logic-selenium/api/clients/label.client";
import { IssueClient } from "@gitea-automation/business-logic-selenium/api/clients/issue.client";
import { Organization } from "@gitea-automation/business-logic-selenium/api/entities/organization.entity";
import { SeededIssue } from "@gitea-automation/business-logic-selenium/api/entities/issue.entity";
import { BrowserStackSession } from "../entities/browserstack.entity";
import { ScenarioState } from "@gitea-automation/business-logic-selenium/state/scenario.entity";
import { WebDriver } from "selenium-webdriver";
import { DriverFactory } from "@gitea-automation/core-selenium/ui/drivers/driver.factory";
import { LoginPage } from "@gitea-automation/business-logic-selenium/ui/pages/authentication/login.page";
import { MainPage } from "@gitea-automation/business-logic-selenium/ui/pages/common/main.page";
import { CreateOrganizationPage } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/create-organization.page";
import { OrganizationDashboardPage } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/organization-dashboard.page";
//Org Fragments
import { OrgRepositoriesFragment } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/fragments/org-repositories.fragment";
import { OrgTeamsFragment } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/fragments/org-teams.fragment";
import { NewTeamFragment } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/fragments/new-team.fragment";
import { SpecificTeamFragment } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/fragments/specific-team.fragment";
import { OrgNavigationFragment } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/fragments/org-navigation.fragment";
import { NavBarFragment } from "@gitea-automation/business-logic-selenium/ui/pages/common/fragments/nav-bar.fragment";
//Org facade
import { OrganizationFacade } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/facade/organization.facade";
import { IssuePage } from "@gitea-automation/business-logic-selenium/ui/pages/issues/issue.page";
import { IssueListPage } from "@gitea-automation/business-logic-selenium/ui/pages/issues/issue-list.page";
import { AuthClient } from "@gitea-automation/business-logic-selenium/api/clients/auth.client";
import {
  isBrowserStack,
  setSessionStatus,
} from "@gitea-automation/core-selenium/config/browserstack.config";
import { applySession, clearSession } from "../utils/session.util";
import { SessionManager } from "../entities/session-manager.entity";
import { LabelListPage } from "@gitea-automation/business-logic-selenium/ui/pages/issues/label-list.page";
import { MilestoneClient } from "@gitea-automation/business-logic-selenium/api/clients/milestone.client";
import {
  ScopedLabels,
  SeededLabel,
} from "@gitea-automation/business-logic-selenium/api/entities/label.entity";
import { SeededMilestone } from "@gitea-automation/business-logic-selenium/api/entities/milestone.entity";
import { User } from "@gitea-automation/business-logic-selenium/api/entities/user.entity";
import { testDataName, uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import { CreateIssuePage } from "@gitea-automation/business-logic-selenium/ui/pages/issues/create-issue.page";
import { MilestoneListPage } from "@gitea-automation/business-logic-selenium/ui/pages/issues/milestone-list.page";
import {
  resolveInvitedCredentials,
  resolveOwnerCredentials,
  resolveOwnerToken,
} from "../utils/session-credentials.util";

interface CustomFixtures {
  driver: WebDriver;
  browserstackSession: BrowserStackSession;
  browserstackStatus: void;
  screenshotOnFailure: void;
  scenarioState: ScenarioState;
  authClient: AuthClient;
  skipAutoLogin: boolean;
  sessionManager: SessionManager;
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
    newTeam: () => NewTeamFragment;
    specificTeam: () => SpecificTeamFragment;
    orgFacade: () => OrganizationFacade;
  };
  issuePage: IssuePage;
  issueListPage: IssueListPage;
  navBarFragment: NavBarFragment;
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
  loggedInSession: [
    async ({ driver, authClient, skipAutoLogin }, use) => {
      if (skipAutoLogin) {
        await use();
        return;
      }

      const { username, password } = resolveOwnerCredentials();
      await applySession(driver, authClient, username, password);
      await use();
    },
    { auto: true },
  ],
  sessionManager: async ({ driver, authClient }, use) => {
    await use({
      loginAs: (username: string, password: string) =>
        applySession(driver, authClient, username, password),
      logout: () => clearSession(driver),
      loginAsOwner: () => {
        const { username, password } = resolveOwnerCredentials();
        return applySession(driver, authClient, username, password);
      },
      loginAsUser2: () => {
        const { username, password } = resolveInvitedCredentials();
        return applySession(driver, authClient, username, password);
      },
    });
  },
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
    const userClient = new UserClient(process.env.GITEA_BASE_URL!, resolveOwnerToken());
    await use(userClient);
  },
  organizationClient: async ({}, use) => {
    const organizationClient = new OrganizationClient(
      process.env.GITEA_BASE_URL!,
      resolveOwnerToken(),
    );
    await use(organizationClient);
  },
  repositoryClient: async ({}, use) => {
    await use(new RepositoryClient(process.env.GITEA_BASE_URL!, resolveOwnerToken()));
  },
  labelClient: async ({}, use) => {
    await use(new LabelClient(process.env.GITEA_BASE_URL!, resolveOwnerToken()));
  },
  labelListPage: async ({ driver }, use) => {
    await use(new LabelListPage(driver));
  },
  issueClient: async ({}, use) => {
    await use(new IssueClient(process.env.GITEA_BASE_URL!, resolveOwnerToken()));
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
    let newTeam: NewTeamFragment | undefined;
    let specificTeam: SpecificTeamFragment | undefined;
    let facade: OrganizationFacade | undefined;

    await use({
      dashboard: () => (dashboard ??= new OrganizationDashboardPage(driver, requireOrganization())),
      navigation: () => (navigation ??= new OrgNavigationFragment(driver)),
      repositories: () => (repositories ??= new OrgRepositoriesFragment(driver)),
      teams: () => (teams ??= new OrgTeamsFragment(driver)),
      newTeam: () => (newTeam ??= new NewTeamFragment(driver)),
      specificTeam: () => (specificTeam ??= new SpecificTeamFragment(driver)),
      orgFacade: () => {
        navigation ??= new OrgNavigationFragment(driver);
        repositories ??= new OrgRepositoriesFragment(driver);
        teams ??= new OrgTeamsFragment(driver);
        newTeam ??= new NewTeamFragment(driver);
        specificTeam ??= new SpecificTeamFragment(driver);

        facade ??= new OrganizationFacade(
          driver,
          requireOrganization(),
          navigation,
          repositories,
          teams,
          newTeam,
          specificTeam,
        );

        return facade;
      },
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
    const { username: owner } = resolveOwnerCredentials();
    const name = `test-issues-${Date.now()}-${process.env.BROWSER ?? "local"}-${uniqueSuffix()}`;

    await repositoryClient.createRepository(name);
    await use(name);
    await repositoryClient.deleteRepository(owner, name);
  },
  scopedLabels: async ({ labelClient, repository }, use) => {
    const { username: owner } = resolveOwnerCredentials();
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
    const { username: owner } = resolveOwnerCredentials();
    const title = "Scoped labels acceptance";
    const response = await issueClient.createIssue(owner, repository, title);

    await use({ id: response.body.id, number: response.body.number, title });
  },
  milestoneClient: async ({}, use) => {
    await use(new MilestoneClient(process.env.GITEA_BASE_URL!, resolveOwnerToken()));
  },
  createIssuePage: async ({ driver }, use) => {
    await use(new CreateIssuePage(driver));
  },
  milestoneListPage: async ({ driver }, use) => {
    await use(new MilestoneListPage(driver));
  },
  maintainer: async ({ userClient }, use) => {
    await use((await userClient.getUser()).body);
  },
  classificationLabel: async ({ labelClient, repository }, use) => {
    const { username: owner } = resolveOwnerCredentials();
    const name = testDataName("ISS-01", "Label");
    const response = await labelClient.createLabel(owner, repository, {
      name,
      color: "#5319e7",
      exclusive: false,
    });

    await use({ id: response.body.id, name });
  },
  milestone: async ({ milestoneClient, repository }, use) => {
    const { username: owner } = resolveOwnerCredentials();
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
  navBarFragment: async ({ driver }, use) => {
    const navBarFragment = new NavBarFragment(driver);
    await use(navBarFragment);
  },
});
