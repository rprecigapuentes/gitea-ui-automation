import { createBdd, test as base } from "playwright-bdd";
import {
  coreFixtures,
  type CoreFixtures,
} from "@gitea-automation/core-playwright/fixtures/base.fixtures";
import {
  issuesFixtures,
  type IssuesFixtures,
} from "@gitea-automation/core-playwright/fixtures/issues.fixtures";
import {
  organizationsFixtures,
  type OrganizationsFixtures,
} from "@gitea-automation/core-playwright/fixtures/organizations.fixtures";
import {
  projectBoardFixtures,
  type ProjectBoardFixtures,
} from "@gitea-automation/core-playwright/fixtures/project-board.fixtures";
import {
  resolveOwnerCredentials,
  type Credentials,
} from "@gitea-automation/core-playwright/fixtures/credentials";

interface BddFixtures {
  ownerCredentials: Credentials;
}

/* The same fixtures `playwright-native` runs on, extended onto playwright-bdd's own base rather
   than @playwright/test's, which is why `core/playwright/fixtures` exports implementations and
   each service calls `.extend()` itself.

   Unlike the specs, which chain a fixture file per area, every step definition of this service
   shares one test object, so it carries the union. A fixture runs only when a step declares it,
   so the ones a scenario never names cost it nothing.

   The organization group has to be chained before the project-board one, which is typed over it.
   Neither needs `organizationCleanupFixtures`: the board fixtures clear `scenarioState.organization`
   and delete what they made, and both members of that group are `auto`, so merging them would build
   the eight API clients for every scenario of the service. A tag-scoped hook is owed to the first
   scenario that creates an organization through the browser, where no fixture owns it. */
export const test = base
  .extend<CoreFixtures & BddFixtures>({
    ...coreFixtures,

    ownerCredentials: async ({}, use, testInfo) => {
      await use(resolveOwnerCredentials(testInfo.project.name));
    },
  })
  .extend<IssuesFixtures>(issuesFixtures)
  .extend<OrganizationsFixtures>(organizationsFixtures)
  .extend<ProjectBoardFixtures>(projectBoardFixtures);

export { expect } from "@playwright/test";

export const { Given, When, Then } = createBdd(test);
