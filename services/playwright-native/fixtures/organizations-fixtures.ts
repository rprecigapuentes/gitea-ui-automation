import { test as base, ORGANIZATION_TAG, ORGANIZATION_NAME_PREFIX } from "./fixture";
import { resolveAdminToken } from "./credentials";
import { UserClient } from "@gitea-automation/business-logic/clients/user.client";
import { RequestStrategyFactory } from "@gitea-automation/core-api-client/request-strategy.factory";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";

export { ORGANIZATION_TAG, ORGANIZATION_NAME_PREFIX };

/** Mirrors the Cucumber suite's own `@smoke` tag. */
export const SMOKE_TAG = "@smoke";

/** Mirrors the Cucumber suite's own `@team-repository` tag — tag a test with this to pick up the
 *  `seededOrganizationWithTeamAndRepository` fixture below. */
export const TEAM_REPOSITORY_TAG = "@team-repository";

/** Mirrors the Cucumber suite's own `@e2e` tag. */
export const E2E_TAG = "@e2e";

const SEEDED_USER_COUNT = 2;
const SEEDED_USER_PASSWORD = "Passw0rd!123";
const SEEDED_TEAM_NAME = "team-1";
const SEEDED_REPOSITORY_NAME = "frontend";

interface SeededOrganizationWithTeamAndRepository {
  organizationName: string;
  teamName: string;
  repositoryName: string;
}

export interface SeededUser {
  username: string;
  password: string;
}

interface OrganizationsFixtures {
  existingOrganization: Organization;
  seededUsers: SeededUser[];
  seededOrganizationWithTeamAndRepository: SeededOrganizationWithTeamAndRepository;
}

/**
 * State the organization smokes and the `@e2e` scenario of `organizations.feature` start from,
 * mirroring the Cucumber suite's own `Given` steps and `Before` hooks for that feature.
 */
export const test = base.extend<OrganizationsFixtures>({
  // "An organization already exists" in the Cucumber smokes: created through the API and recorded
  // in `scenarioState`, so `cleanupCreatedOrganization` (in `fixture.ts`) removes it.
  existingOrganization: async ({ clients, scenarioState }, use, testInfo) => {
    const organization: Organization = {
      name: `at-org-${testInfo.project.name}-${uniqueSuffix()}`,
      visibility: "public",
    };

    await clients.organizations.createOrganization(organization.name, organization.visibility);
    scenarioState.organization = organization;

    await use(organization);
  },

  // The Cucumber suite's `createSeededUsers`: "user 1" and "user 2", created through the admin API
  // and deleted after the test. Named per browser, so the three browsers never share one.
  seededUsers: async ({}, use, testInfo) => {
    const users = new UserClient(
      RequestStrategyFactory.playwright(process.env.GITEA_BASE_URL!, resolveAdminToken()),
    );
    const seeded: SeededUser[] = [];

    for (let index = 1; index <= SEEDED_USER_COUNT; index += 1) {
      const username = `at-user-${index}-${testInfo.project.name}-${uniqueSuffix()}`;
      await users.createUser(username, `${username}@example.com`, SEEDED_USER_PASSWORD);
      seeded.push({ username, password: SEEDED_USER_PASSWORD });
    }

    await use(seeded);

    for (const { username } of seeded) {
      await users.deleteUser(username);
    }
  },

  // One organization with a team and a repository: the state `@team-repository`-tagged tests start
  // from, mirroring the Cucumber hook of that tag. `cleanupCreatedOrganization` removes it.
  seededOrganizationWithTeamAndRepository: async ({ clients, scenarioState }, use, testInfo) => {
    const organizationName = `at-team-repo-${testInfo.project.name}-${uniqueSuffix()}`;

    await clients.organizations.createOrganization(organizationName);
    scenarioState.organization = { name: organizationName, visibility: "private" };
    await clients.teams.createTeam(organizationName, SEEDED_TEAM_NAME, "write");
    await clients.repositories.createOrganizationRepository(
      organizationName,
      SEEDED_REPOSITORY_NAME,
    );

    await use({
      organizationName,
      teamName: SEEDED_TEAM_NAME,
      repositoryName: SEEDED_REPOSITORY_NAME,
    });
  },
});

export { expect } from "@playwright/test";
