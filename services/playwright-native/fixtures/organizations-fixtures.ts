import { test as base } from "./fixture";
import {
  organizationsFixtures,
  type OrganizationsFixtures,
} from "@gitea-automation/shared-playwright/organizations.fixtures";

export { ORGANIZATION_TAG, ORGANIZATION_NAME_PREFIX } from "./fixture";
export {
  SMOKE_TAG,
  TEAM_REPOSITORY_TAG,
  E2E_TAG,
  type SeededUser,
} from "@gitea-automation/shared-playwright/organizations.fixtures";

export const test = base.extend<OrganizationsFixtures>(organizationsFixtures);

export { expect } from "@playwright/test";
