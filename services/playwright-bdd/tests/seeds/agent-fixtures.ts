/* Plain Playwright tests, not scenarios: the MCP server runs one before any feature exists for it,
   so they extend @playwright/test's base rather than the BDD one. This file's name carries no
   "seed", which is the substring the server finds a starting state by.

   Without the organization cleanup the step definitions mount: a starting state exists to leave
   the seeded world standing for an agent to look at. */
import { test as base } from "@playwright/test";
import { coreFixtures, type CoreFixtures } from "@gitea-automation/shared-playwright/base.fixtures";
import {
  issuesFixtures,
  type IssuesFixtures,
} from "@gitea-automation/shared-playwright/issues.fixtures";
import {
  organizationsFixtures,
  type OrganizationsFixtures,
} from "@gitea-automation/shared-playwright/organizations.fixtures";
import {
  projectBoardFixtures,
  type ProjectBoardFixtures,
} from "@gitea-automation/shared-playwright/project-board.fixtures";

export const test = base
  .extend<CoreFixtures>(coreFixtures)
  .extend<IssuesFixtures>(issuesFixtures)
  .extend<OrganizationsFixtures>(organizationsFixtures)
  .extend<ProjectBoardFixtures>(projectBoardFixtures);
