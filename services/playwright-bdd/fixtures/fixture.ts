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

   The organization and project-board groups are not here yet: they record into `scenarioState` and
   rely on a teardown this service does not have, which arrives as tag-scoped hooks with the first
   scenario that seeds an organization. */
export const test = base
  .extend<CoreFixtures & BddFixtures>({
    ...coreFixtures,

    ownerCredentials: async ({}, use, testInfo) => {
      await use(resolveOwnerCredentials(testInfo.project.name));
    },
  })
  .extend<IssuesFixtures>(issuesFixtures);

export { expect } from "@playwright/test";

export const { Given, When, Then } = createBdd(test);
