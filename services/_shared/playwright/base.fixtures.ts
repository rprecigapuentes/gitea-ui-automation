import type { Fixtures, PlaywrightTestArgs, PlaywrightTestOptions } from "@playwright/test";
import type { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { InteractionStrategyFactory } from "@gitea-automation/core-page-objects/interaction-strategy.factory";
import { RequestStrategyFactory } from "@gitea-automation/core-api-client/request-strategy.factory";
import { PageFactory } from "@gitea-automation/business-logic/pages/page.factory";
import type { ScenarioState } from "@gitea-automation/business-logic/state/scenario.entity";
import { AuthClient } from "@gitea-automation/business-logic/clients/auth.client";
import { OrganizationClient } from "@gitea-automation/business-logic/clients/organizations.client";
import { RepositoryClient } from "@gitea-automation/business-logic/clients/repository.client";
import { IssueClient } from "@gitea-automation/business-logic/clients/issue.client";
import { LabelClient } from "@gitea-automation/business-logic/clients/label.client";
import { TeamClient } from "@gitea-automation/business-logic/clients/team.client";
import { MilestoneClient } from "@gitea-automation/business-logic/clients/milestone.client";
import { UserClient } from "@gitea-automation/business-logic/clients/user.client";
import { resolveOwnerCredentials, resolveOwnerToken } from "./credentials";
import { applySession, clearSession } from "./session.util";

export interface Clients {
  auth: AuthClient;
  organizations: OrganizationClient;
  repositories: RepositoryClient;
  issues: IssueClient;
  labels: LabelClient;
  teams: TeamClient;
  milestones: MilestoneClient;
  users: UserClient;
}

export interface SessionManager {
  loginAs: (username: string, password: string) => Promise<void>;
  loginAsOwner: () => Promise<void>;
  logout: () => Promise<void>;
}

/** Tag of the organization end-to-end test; pairs with `cleanupOrganizationsBeforeRun`. */
export const ORGANIZATION_TAG = "@organization";

/** Prefix of the organizations the organization end-to-end test creates. */
export const ORGANIZATION_NAME_PREFIX = "test-orgs";

export interface CoreFixtures {
  strategy: IInteractionStrategy;
  clients: Clients;
  pageObjects: PageFactory;
  scenarioState: ScenarioState;
  sessionManager: SessionManager;
}

export interface OrganizationCleanupFixtures {
  cleanupCreatedOrganization: void;
  cleanupOrganizationsBeforeRun: void;
}

/* Implementations rather than an extended `test`: the two services extend different bases and
   each calls `.extend()` with this object. */
export const coreFixtures: Fixtures<
  CoreFixtures,
  object,
  PlaywrightTestArgs & PlaywrightTestOptions
> = {
  strategy: async ({ page }, use) => {
    await use(InteractionStrategyFactory.playwright(page));
  },
  // Acts as the owner of the running browser's project, so parallel browsers are different users.
  clients: async ({}, use, testInfo) => {
    const baseUrl = process.env.GITEA_BASE_URL!;
    const strategy = RequestStrategyFactory.playwright(
      baseUrl,
      resolveOwnerToken(testInfo.project.name),
    );

    await use({
      auth: new AuthClient(baseUrl),
      organizations: new OrganizationClient(strategy),
      repositories: new RepositoryClient(strategy),
      issues: new IssueClient(strategy),
      labels: new LabelClient(strategy),
      teams: new TeamClient(strategy),
      milestones: new MilestoneClient(strategy),
      users: new UserClient(strategy),
    });
  },
  scenarioState: async ({}, use) => {
    const scenarioState: ScenarioState = {};
    await use(scenarioState);
  },
  pageObjects: async ({ strategy, scenarioState }, use) => {
    await use(new PageFactory(strategy, scenarioState));
  },
  sessionManager: async ({ clients, context, page }, use, testInfo) => {
    await use({
      loginAs: (username: string, password: string) =>
        applySession(context, page, clients.auth, username, password),
      loginAsOwner: () => {
        const { username, password } = resolveOwnerCredentials(testInfo.project.name);
        return applySession(context, page, clients.auth, username, password);
      },
      logout: () => clearSession(context),
    });
  },
};

/* Kept out of `coreFixtures` because both are `auto`: a test object that adds them builds the
   eight API clients for every test. Both suites add them; the agents' starting states do not. */
export const organizationCleanupFixtures: Fixtures<
  OrganizationCleanupFixtures,
  object,
  CoreFixtures & PlaywrightTestArgs & PlaywrightTestOptions
> = {
  // A test that creates an organization records it in `scenarioState`; this removes it and its
  // repositories afterwards, whether the test passed or failed.
  cleanupCreatedOrganization: [
    async ({ clients, scenarioState }, use) => {
      await use();
      if (scenarioState.organization) {
        const { name } = scenarioState.organization;
        // Gitea refuses to delete an organization that still owns a repository.
        for (const repository of await clients.repositories.getOrganizationRepositories(name)) {
          await clients.repositories.deleteRepository(name, repository.name);
        }
        await clients.organizations.deleteOrganization(name);
      }
    },
    { auto: true },
  ],

  // Removes what a crashed run left behind, only under the test's own prefix so a parallel
  // worker's organizations are never touched.
  cleanupOrganizationsBeforeRun: [
    async ({ clients }, use, testInfo) => {
      if (testInfo.tags.includes(ORGANIZATION_TAG)) {
        for (const { name } of await clients.organizations.getUserOrganizations()) {
          if (name.startsWith(ORGANIZATION_NAME_PREFIX)) {
            await clients.organizations.deleteOrganization(name);
          }
        }
      }
      await use();
    },
    { auto: true },
  ],
};
