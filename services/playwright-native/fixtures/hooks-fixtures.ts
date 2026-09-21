import { test as base } from "./fixture";
import { testDataName, uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import type { SeededRepository } from "@gitea-automation/business-logic/state/scenario.entity";

/** Mirrors the Cucumber suite's own `@project-board` tag on `project-board.feature` — tag a test
 *  with this to pick up the `seededOrganizationWithRepositories` fixture below. */
export const PROJECT_BOARD_TAG = "@project-board";

/** Tag of the organization end-to-end test; pairs with `cleanupOrganizationsBeforeRun`. */
export const ORGANIZATION_TAG = "@organization";

/** Prefix of the organizations the organization end-to-end test creates. */
export const ORGANIZATION_NAME_PREFIX = "test-orgs";

const PROJECT_BOARD_REPOSITORY_COUNT = 2;

interface SeededOrganizationWithRepositories {
  organizationName: string;
  repositories: SeededRepository[];
}

interface HooksFixtures {
  seededOrganizationWithRepositories: SeededOrganizationWithRepositories;
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
  cleanupOrganizationsBeforeRun: async ({ clients }, use) => {
    for (const { name } of await clients.organizations.getUserOrganizations()) {
      if (name.startsWith(ORGANIZATION_NAME_PREFIX)) {
        await clients.organizations.deleteOrganization(name);
      }
    }
    await use();
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
