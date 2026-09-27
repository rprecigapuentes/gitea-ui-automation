import { test as base } from "./fixture";
import {
  issuesFixtures,
  type IssuesFixtures,
} from "@gitea-automation/core-playwright/fixtures/issues.fixtures";

export const test = base.extend<IssuesFixtures>(issuesFixtures);

export { expect } from "@playwright/test";
