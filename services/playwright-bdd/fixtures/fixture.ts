import { createBdd, test as base } from "playwright-bdd";
import {
  coreFixtures,
  type CoreFixtures,
} from "@gitea-automation/core-playwright/fixtures/base.fixtures";
import {
  resolveOwnerCredentials,
  type Credentials,
} from "@gitea-automation/core-playwright/fixtures/credentials";

interface BddFixtures {
  ownerCredentials: Credentials;
}

/* The same fixtures `playwright-native` runs on, extended onto playwright-bdd's own base rather
   than @playwright/test's, which is why `core/playwright/fixtures` exports implementations and
   each service calls `.extend()` itself. */
export const test = base.extend<CoreFixtures & BddFixtures>({
  ...coreFixtures,

  ownerCredentials: async ({}, use, testInfo) => {
    await use(resolveOwnerCredentials(testInfo.project.name));
  },
});

export { expect } from "@playwright/test";

export const { Given, When, Then } = createBdd(test);
