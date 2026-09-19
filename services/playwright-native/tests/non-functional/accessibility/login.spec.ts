import { test, expect, violationFingerprints } from "../../../fixtures/axe.fixture";

test("the login form carries no accessibility violation that is not already recorded", async ({
  pageObjects,
  makeAxeBuilder,
  publishScan,
}) => {
  await pageObjects.loginPage.open();
  expect(await pageObjects.loginPage.hasExpectedFormElements()).toBe(true);

  const results = await makeAxeBuilder().analyze();
  await publishScan(results, "login");

  expect(violationFingerprints(results)).toMatchSnapshot("login-violations.txt");
});
