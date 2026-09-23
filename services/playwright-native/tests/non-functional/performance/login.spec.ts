import { test, expect } from "../../../fixtures/performance.fixture";

test("the login form is measured as an anonymous visitor reaches it", async ({
  pageObjects,
  performanceCollector,
  publishMeasurement,
}) => {
  const measurement = await performanceCollector.measure("login", () =>
    pageObjects.loginPage.open(),
  );
  expect(await pageObjects.loginPage.hasExpectedFormElements()).toBe(true);

  await publishMeasurement(measurement);
});
