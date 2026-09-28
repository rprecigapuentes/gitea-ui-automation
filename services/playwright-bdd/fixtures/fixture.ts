import { createBdd, test as base } from "playwright-bdd";
import {
  coreFixtures,
  organizationCleanupFixtures,
  type CoreFixtures,
  type OrganizationCleanupFixtures,
} from "@gitea-automation/shared-playwright/base.fixtures";
import {
  issuesFixtures,
  type IssuesFixtures,
} from "@gitea-automation/shared-playwright/issues.fixtures";
import {
  organizationsFixtures,
  type OrganizationsFixtures,
} from "@gitea-automation/shared-playwright/organizations.fixtures";
import {
  resolveOwnerCredentials,
  type Credentials,
} from "@gitea-automation/shared-playwright/credentials";

interface BddFixtures {
  ownerCredentials: Credentials;
}

/* Every step definition shares one test object, so it carries the union of the groups. The
   organization cleanup is `auto`, so it runs for every scenario. */
export const test = base
  .extend<CoreFixtures & BddFixtures>({
    ...coreFixtures,

    ownerCredentials: async ({}, use, testInfo) => {
      await use(resolveOwnerCredentials(testInfo.project.name));
    },
  })
  .extend<IssuesFixtures>(issuesFixtures)
  .extend<OrganizationCleanupFixtures>(organizationCleanupFixtures)
  .extend<OrganizationsFixtures>(organizationsFixtures);

export { expect } from "@playwright/test";

export const { Given, When, Then } = createBdd(test);
