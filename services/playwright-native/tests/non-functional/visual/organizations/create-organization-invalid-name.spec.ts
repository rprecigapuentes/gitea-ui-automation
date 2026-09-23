import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import { resolveOwnerCredentials } from "../../../../fixtures/credentials";
import { test } from "../../../../fixtures/visual.fixture";

interface InvalidNameContext {
  organization: Organization;
  owner: string;
}

interface InvalidNameCase {
  name: (context: InvalidNameContext) => string;
  reason: string;
  maxDiffPixels?: number;
}

const invalidNameCases: InvalidNameCase[] = [
  { name: () => "test@org", reason: "has a disallowed character" },
  { name: () => "-test-org", reason: "starts with a non-alphanumeric character" },
  { name: () => "test-org-", reason: "ends with a non-alphanumeric character" },
  { name: () => "test--org", reason: "has consecutive non-alphanumeric characters" },
  { name: () => "test org", reason: "has spaces" },
  { name: ({ owner }) => owner, reason: "matches the username", maxDiffPixels: 43000 },
  {
    name: ({ organization }) => organization.name,
    reason: "already exists",
    maxDiffPixels: 43000,
  },
];

for (const { name, reason, maxDiffPixels } of invalidNameCases) {
  test(`Organizations smoke: create organization rejects a name that ${reason}`, async ({
    page,
    pageObjects,
    clients,
    scenarioState,
    sessionManager,
    visualTester,
  }, testInfo) => {
    const organization: Organization = {
      name: `at-org-${testInfo.project.name}-${uniqueSuffix()}`,
      visibility: "public",
    };
    await clients.organizations.createOrganization(organization.name, organization.visibility);
    scenarioState.organization = organization;

    const owner = resolveOwnerCredentials(testInfo.project.name).username;
    const value = name({ organization, owner });

    await sessionManager.loginAsOwner();

    await pageObjects.createOrganizationPage.open();
    await pageObjects.createOrganizationPage.enterOrganizationName(value);
    await pageObjects.createOrganizationPage.clickCreateOrganizationButton();
    await pageObjects.createOrganizationPage.waitForElements();

    await visualTester.verifyPage(page, "organization-create-form-invalid.png", {
      mask: pageObjects.createOrganizationPage.getVolatileRegions(),
      maxDiffPixels,
    });
  });
}
