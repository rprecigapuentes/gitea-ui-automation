import { test, expect } from "../../../fixtures/performance.fixture";

test("the user dashboard is measured as the signed-in owner reaches it", async ({
  sessionManager,
  pageObjects,
  performanceCollector,
  publishMeasurement,
}) => {
  await sessionManager.loginAsOwner();

  // The session ends by navigating to the base URL, so the figures are read from the navigation
  // the page object performs and not from that one.
  const measurement = await performanceCollector.measure("dashboard", () =>
    pageObjects.mainPage.open(),
  );
  expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);

  await publishMeasurement(measurement);
});
