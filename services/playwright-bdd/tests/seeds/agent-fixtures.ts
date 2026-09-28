/* Plain Playwright tests, not scenarios: the MCP server runs one before any feature exists for it,
   so they extend @playwright/test's base rather than the BDD one. This file's name carries no
   "seed", which is the substring the server finds a starting state by. */
import { test as base } from "@playwright/test";
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

export const test = base
  .extend<CoreFixtures>(coreFixtures)
  .extend<IssuesFixtures>(issuesFixtures)
  .extend<OrganizationsFixtures>(organizationsFixtures)
  .extend<ProjectBoardFixtures>(projectBoardFixtures);
