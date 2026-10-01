import { test as base } from "@playwright/test";
import {
  coreFixtures,
  organizationCleanupFixtures,
  type CoreFixtures,
  type OrganizationCleanupFixtures,
} from "@gitea-automation/shared-playwright/base.fixtures";

export {
  ORGANIZATION_TAG,
  ORGANIZATION_NAME_PREFIX,
} from "@gitea-automation/shared-playwright/base.fixtures";

// The native suite's test object: the shared fixtures, with the organization cleanup.
export const test = base.extend<CoreFixtures & OrganizationCleanupFixtures>({
  ...coreFixtures,
  ...organizationCleanupFixtures,
});

export { expect } from "@playwright/test";
