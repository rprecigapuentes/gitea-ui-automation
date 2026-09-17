import { test as base } from "@playwright/test";
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

interface Clients {
  auth: AuthClient;
  organizations: OrganizationClient;
  repositories: RepositoryClient;
  issues: IssueClient;
  labels: LabelClient;
  teams: TeamClient;
  milestones: MilestoneClient;
  users: UserClient;
}

interface SessionManager {
  loginAs: (username: string, password: string) => Promise<void>;
  loginAsOwner: () => Promise<void>;
  logout: () => Promise<void>;
}

interface CustomFixtures {
  strategy: IInteractionStrategy;
  clients: Clients;
  pages: PageFactory;
  scenarioState: ScenarioState;
  sessionManager: SessionManager;
}

export const test = base.extend<CustomFixtures>({
  strategy: async ({ page }, use) => {
    await use(InteractionStrategyFactory.playwright(page));
  },
  clients: async ({}, use) => {
    const baseUrl = process.env.GITEA_BASE_URL!;
    const strategy = RequestStrategyFactory.playwright(baseUrl, resolveOwnerToken());

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
  pages: async ({ strategy, scenarioState }, use) => {
    await use(new PageFactory(strategy, scenarioState));
  },
  sessionManager: async ({ clients, context, page }, use) => {
    await use({
      loginAs: (username: string, password: string) =>
        applySession(context, page, clients.auth, username, password),
      loginAsOwner: () => {
        const { username, password } = resolveOwnerCredentials();
        return applySession(context, page, clients.auth, username, password);
      },
      logout: () => clearSession(context),
    });
  },
});

export { expect } from "@playwright/test";
