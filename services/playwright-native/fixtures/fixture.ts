import { test as base } from "@playwright/test";
import {
  coreFixtures,
  organizationCleanupFixtures,
  type CoreFixtures,
  type OrganizationCleanupFixtures,
} from "@gitea-automation/core-playwright/fixtures/base.fixtures";

export {
  ORGANIZATION_TAG,
  ORGANIZATION_NAME_PREFIX,
} from "@gitea-automation/core-playwright/fixtures/base.fixtures";

export const test = base.extend<CoreFixtures & OrganizationCleanupFixtures>({
  ...coreFixtures,
  ...organizationCleanupFixtures,
});

export { expect } from "@playwright/test";
