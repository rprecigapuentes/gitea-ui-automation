import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import { resolveOwnerCredentials } from "../../../../fixtures/credentials";
import { test as base } from "../../../../fixtures/visual.fixture";

interface ExistingOrganizationFixture {
  existingOrganization: Organization;
}

// "An organization already exists" precondition, the same one `organizations-fixtures.ts` exposes
// for the functional suite; duplicated here because that fixture and the visual suite's extend two
// different bases and this spec needs both it and `visualTester` together.
const test = base.extend<ExistingOrganizationFixture>({
  existingOrganization: async ({ clients, scenarioState }, use, testInfo) => {
    const organization: Organization = {
      name: `at-org-${testInfo.project.name}-${uniqueSuffix()}`,
      visibility: "public",
    };

    await clients.organizations.createOrganization(organization.name, organization.visibility);
    scenarioState.organization = organization;

    await use(organization);
  },
});

interface InvalidNameContext {
  existingOrganization: Organization;
  owner: string;
}

interface InvalidNameCase {
  name: (context: InvalidNameContext) => string;
  reason: string;
}

const invalidNameCases: InvalidNameCase[] = [
  { name: () => "test@org", reason: "has a disallowed character" },
  { name: () => "-test-org", reason: "starts with a non-alphanumeric character" },
  { name: () => "test-org-", reason: "ends with a non-alphanumeric character" },
  { name: () => "test--org", reason: "has consecutive non-alphanumeric characters" },
  { name: () => "test org", reason: "has spaces" },
  { name: ({ owner }) => owner, reason: "matches the username" },
  { name: ({ existingOrganization }) => existingOrganization.name, reason: "already exists" },
];

for (const { name, reason } of invalidNameCases) {
  test(`Organizations smoke: create organization rejects a name that ${reason}`, async ({
    page,
    pageObjects,
    existingOrganization,
    sessionManager,
    visualTester,
  }, testInfo) => {
    const owner = resolveOwnerCredentials(testInfo.project.name).username;
    const value = name({ existingOrganization, owner });

    await sessionManager.loginAsOwner();

    await pageObjects.createOrganizationPage.open();
    await pageObjects.createOrganizationPage.enterOrganizationName(value);
    await pageObjects.createOrganizationPage.clickCreateOrganizationButton();
    await pageObjects.createOrganizationPage.waitForElements();

    await visualTester.verifyPage(page, "organization-create-form-invalid.png", {
      mask: pageObjects.createOrganizationPage.getVolatileRegions(),
    });
  });
}
