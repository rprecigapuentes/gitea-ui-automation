import { test, expect, violationFingerprints } from "../../../fixtures/axe.fixture";

test("the user dashboard carries no accessibility violation that is not already recorded", async ({
  sessionManager,
  pageObjects,
  makeAxeBuilder,
  publishScan,
}) => {
  await sessionManager.loginAsOwner();
  await pageObjects.mainPage.open();
  // Only a signed-in visitor gets these, so this also proves the session held.
  expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);

  const results = await makeAxeBuilder(pageObjects.mainPage.getScanExclusions()).analyze();
  await publishScan(results, "dashboard");

  expect(violationFingerprints(results)).toMatchSnapshot("dashboard-violations.txt");
});
