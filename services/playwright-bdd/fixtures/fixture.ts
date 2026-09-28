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

/* Every step definition shares one test object, so it carries the union of the groups. The
   organization group comes before the project-board one, which is typed over it. */
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
