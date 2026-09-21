import { test as base } from "./fixture";
import { testDataName, uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import type { SeededRepository } from "@gitea-automation/business-logic/state/scenario.entity";
import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";

/** Mirrors the Cucumber suite's own `@project-board` tag on `project-board.feature` — tag a test
 *  with this to pick up the `seededOrganizationWithRepositories` fixture below. */
export const PROJECT_BOARD_TAG = "@project-board";

/** Mirrors the Cucumber suite's own `@smoke` tag. */
export const SMOKE_TAG = "@smoke";

/** Mirrors the Cucumber suite's own `@team-repository` tag — tag a test with this to pick up the
 *  `seededOrganizationWithTeamAndRepository` fixture below. */
export const TEAM_REPOSITORY_TAG = "@team-repository";

/** Tag of the organization end-to-end test; pairs with `cleanupOrganizationsBeforeRun`. */
export const ORGANIZATION_TAG = "@organization";

/** Prefix of the organizations the organization end-to-end test creates. */
export const ORGANIZATION_NAME_PREFIX = "test-orgs";

const PROJECT_BOARD_REPOSITORY_COUNT = 2;
const SEEDED_TEAM_NAME = "team-1";
const SEEDED_REPOSITORY_NAME = "frontend";

interface SeededOrganizationWithRepositories {
  organizationName: string;
  repositories: SeededRepository[];
}

interface SeededOrganizationWithTeamAndRepository {
  organizationName: string;
  teamName: string;
  repositoryName: string;
}

interface HooksFixtures {
  seededOrganizationWithRepositories: SeededOrganizationWithRepositories;
  existingOrganization: Organization;
  seededOrganizationWithTeamAndRepository: SeededOrganizationWithTeamAndRepository;
  cleanupCreatedOrganization: void;
  cleanupOrganizationsBeforeRun: void;
}

/**
 * One organization, two repositories, one issue in each: the state `@project-board`-tagged tests
 * start from, mirroring `hooks.ts`'s `seedOrganizationWithIssues` in the Cucumber suite. The
 * precondition runs before `use()`, the postcondition after — Playwright tears it down even when
 * the test fails, so no try/finally is needed in the test itself.
 */
export const test = base.extend<HooksFixtures>({
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

  // "An organization already exists" in the Cucumber smokes: created through the API and recorded
  // in `scenarioState`, so `cleanupCreatedOrganization` removes it.
  existingOrganization: async ({ clients, scenarioState }, use, testInfo) => {
    const organization: Organization = {
      name: `at-org-${testInfo.project.name}-${uniqueSuffix()}`,
      visibility: "public",
    };

    await clients.organizations.createOrganization(organization.name, organization.visibility);
    scenarioState.organization = organization;

    await use(organization);
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

  seededOrganizationWithRepositories: async ({ clients }, use, testInfo) => {
    const organizationName = `at-board-${testInfo.project.name}-${uniqueSuffix()}`;
    await clients.organizations.createOrganization(organizationName);

    const repositories: SeededRepository[] = [];
    for (let index = 1; index <= PROJECT_BOARD_REPOSITORY_COUNT; index += 1) {
      const repositoryName = `at-repo-${index}-${testInfo.project.name}-${uniqueSuffix()}`;
      await clients.repositories.createOrganizationRepository(organizationName, repositoryName);

      const title = testDataName("S2-SMK-DND", `Issue-${index}`);
      const issue = await clients.issues.createIssue(organizationName, repositoryName, title);

      repositories.push({ name: repositoryName, issue });
    }

    await use({ organizationName, repositories });

    for (const repository of repositories) {
      await clients.repositories.deleteRepository(organizationName, repository.name);
    }
    await clients.organizations.deleteOrganization(organizationName);
  },
});

export { expect } from "@playwright/test";
