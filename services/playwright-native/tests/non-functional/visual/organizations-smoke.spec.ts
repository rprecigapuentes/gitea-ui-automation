import { test } from "../../../fixtures/visual.fixture";

test("Organizations smoke: the views along the flow", async ({
  page,
  pageObjects,
  clients,
  scenarioState,
  sessionManager,
  visualTester,
}, testInfo) => {
  await sessionManager.loginAsOwner();

  await pageObjects.createOrganizationPage.open();
  await visualTester.verifyPage(page, "organization-create-form.png", {
    mask: pageObjects.createOrganizationPage.getVolatileRegions(),
  });

  scenarioState.organization = await clients.organizations.createOrganization(
    `at-visual-org-${testInfo.project.name}`,
  );

  await pageObjects.orgFacade.open();
  await pageObjects.orgFacade.waitForElements();
  await visualTester.verifyPage(page, "organization-profile.png", {
    mask: pageObjects.orgFacade.getVolatileRegions(),
  });

  await clients.teams.createTeam(scenarioState.organization.name, "at-visual-team");
  await pageObjects.orgFacade.navigateToTeamsTab();
  await visualTester.verifyPage(page, "organization-teams.png", {
    mask: pageObjects.orgFacade.getVolatileRegions(),
  });
});
