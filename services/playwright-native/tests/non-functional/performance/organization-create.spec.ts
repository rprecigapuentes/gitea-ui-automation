import { test, expect } from "../../../fixtures/performance.fixture";

test("organization creation is measured as the signed-in owner reaches it", async ({
  sessionManager,
  pageObjects,
  performanceCollector,
  publishMeasurement,
}) => {
  await sessionManager.loginAsOwner();

  const measurement = await performanceCollector.measure("organization-create", () =>
    pageObjects.createOrganizationPage.open(),
  );
  expect(await pageObjects.createOrganizationPage.hasExpectedFormElements()).toBe(true);

  await publishMeasurement(measurement);
});
