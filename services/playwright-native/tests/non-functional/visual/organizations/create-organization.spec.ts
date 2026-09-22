import { test } from "../../../../fixtures/visual.fixture";

test("Organizations smoke: create an organization through the form", async ({
  page,
  pageObjects,
  scenarioState,
  sessionManager,
  visualTester,
}, testInfo) => {
  const name = `at-vis-org-${testInfo.project.name}`;
  await sessionManager.loginAsOwner();

  await pageObjects.createOrganizationPage.open();
  await visualTester.verifyPage(page, "organization-create-form.png", {
    mask: pageObjects.createOrganizationPage.getVolatileRegions(),
  });

  await pageObjects.createOrganizationPage.enterOrganizationName(name);
  await pageObjects.createOrganizationPage.selectVisibility("private");
  await visualTester.verifyPage(page, "organization-create-form-filled.png", {
    mask: pageObjects.createOrganizationPage.getVolatileRegions(),
  });

  await pageObjects.createOrganizationPage.clickCreateOrganizationButton();
  const organization = { name, visibility: "private" as const };
  scenarioState.organization = organization;

  await pageObjects.organizationDashboardPage.waitForElements(organization);
  await visualTester.verifyPage(page, "organization-dashboard.png", {
    mask: pageObjects.organizationDashboardPage.getVolatileRegions(),
    maxDiffPixels: 1800,
  });

  await pageObjects.orgFacade.open();
  await pageObjects.orgFacade.waitForElements();
  await visualTester.verifyPage(page, "organization-profile.png", {
    mask: pageObjects.orgFacade.getVolatileRegions(),
  });
});
