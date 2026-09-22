import { resolveOwnerCredentials } from "../../../../fixtures/credentials";
import { test } from "../../../../fixtures/visual.fixture";

const INVALID_NAME_BASELINE = "organization-create-form-invalid.png";

interface InvalidNameCase {
  name: string;
  reason: string;
}

const invalidNameCases: InvalidNameCase[] = [
  { name: "test@org", reason: "has a disallowed character" },
  { name: "-test-org", reason: "starts with a non-alphanumeric character" },
  { name: "test-org-", reason: "ends with a non-alphanumeric character" },
  { name: "test--org", reason: "has consecutive non-alphanumeric characters" },
  { name: "test org", reason: "has spaces" },
];

for (const { name, reason } of invalidNameCases) {
  test(`Organizations smoke: create organization rejects a name that ${reason}`, async ({
    page,
    pageObjects,
    sessionManager,
    visualTester,
  }) => {
    await sessionManager.loginAsOwner();

    await pageObjects.createOrganizationPage.open();
    await pageObjects.createOrganizationPage.enterOrganizationName(name);
    await pageObjects.createOrganizationPage.clickCreateOrganizationButton();
    await pageObjects.createOrganizationPage.waitForElements();

    await visualTester.verifyPage(page, INVALID_NAME_BASELINE, {
      mask: pageObjects.createOrganizationPage.getVolatileRegions(),
    });
  });
}

test("Organizations smoke: create organization rejects a name matching the username", async ({
  page,
  pageObjects,
  sessionManager,
  visualTester,
}, testInfo) => {
  const owner = resolveOwnerCredentials(testInfo.project.name);
  await sessionManager.loginAsOwner();

  await pageObjects.createOrganizationPage.open();
  await pageObjects.createOrganizationPage.enterOrganizationName(owner.username);
  await pageObjects.createOrganizationPage.clickCreateOrganizationButton();
  await pageObjects.createOrganizationPage.waitForElements();

  await visualTester.verifyPage(page, INVALID_NAME_BASELINE, {
    mask: pageObjects.createOrganizationPage.getVolatileRegions(),
  });
});

test("Organizations smoke: create organization rejects a name that already exists", async ({
  page,
  pageObjects,
  clients,
  scenarioState,
  sessionManager,
  visualTester,
}, testInfo) => {
  const name = `existing-org-${testInfo.project.name}`;
  await clients.organizations.createOrganization(name);
  scenarioState.organization = { name, visibility: "private" };
  await sessionManager.loginAsOwner();

  await pageObjects.createOrganizationPage.open();
  await pageObjects.createOrganizationPage.enterOrganizationName(name);
  await pageObjects.createOrganizationPage.clickCreateOrganizationButton();
  await pageObjects.createOrganizationPage.waitForElements();

  await visualTester.verifyPage(page, INVALID_NAME_BASELINE, {
    mask: pageObjects.createOrganizationPage.getVolatileRegions(),
  });
});
