// Chained onto the organization fixtures, not onto `fixture` directly, because the demo scenario
// needs this file's seeded organization and that file's seeded users at once.
import { test as base } from "./organizations-fixtures";
import {
  projectBoardFixtures,
  type ProjectBoardFixtures,
} from "@gitea-automation/core-playwright/fixtures/project-board.fixtures";

export {
  PROJECT_BOARD_TAG,
  type SeededOrganizationWithRepositories,
} from "@gitea-automation/core-playwright/fixtures/project-board.fixtures";

export const test = base.extend<ProjectBoardFixtures>(projectBoardFixtures);

export { expect } from "@playwright/test";
