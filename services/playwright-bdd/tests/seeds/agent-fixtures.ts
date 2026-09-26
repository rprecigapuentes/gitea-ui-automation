/* The starting states are plain Playwright tests, not scenarios: the MCP server runs one to open a
   browser for an agent, and no feature exists for it. So they extend @playwright/test's base with
   the shared fixtures directly, rather than the BDD test the step definitions are built on.

   Named without "seed": the server finds a starting state by looking for a basename that contains
   it, so `seed.spec.ts` has to stay the only file in this directory that does. */
import { test as base } from "@playwright/test";
import {
  coreFixtures,
  type CoreFixtures,
} from "@gitea-automation/core-playwright/fixtures/base.fixtures";
import {
  issuesFixtures,
  type IssuesFixtures,
} from "@gitea-automation/core-playwright/fixtures/issues.fixtures";

export const test = base.extend<CoreFixtures>(coreFixtures).extend<IssuesFixtures>(issuesFixtures);
