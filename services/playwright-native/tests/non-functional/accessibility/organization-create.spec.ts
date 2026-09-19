import { test, expect, violationFingerprints } from "../../../fixtures/axe.fixture";

test("organization creation carries no accessibility violation that is not already recorded", async ({
  sessionManager,
  pageObjects,
  makeAxeBuilder,
  publishScan,
}) => {
  await sessionManager.loginAsOwner();
  await pageObjects.createOrganizationPage.open();
  expect(await pageObjects.createOrganizationPage.hasExpectedFormElements()).toBe(true);

  const results = await makeAxeBuilder().analyze();
  await publishScan(results, "organization-create");

  expect(violationFingerprints(results)).toMatchSnapshot("organization-create-violations.txt");
});
