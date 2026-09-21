import { test } from "../../../../fixtures/visual.fixture";

test("Organizations smoke: create a team", async ({
  page,
  pageObjects,
  clients,
  scenarioState,
  sessionManager,
  visualTester,
}, testInfo) => {
  scenarioState.organization = await clients.organizations.createOrganization(
    `at-vis-team-${testInfo.project.name}`,
  );
  const teamName = "at-vis-team";
  await sessionManager.loginAsOwner();

  await pageObjects.orgFacade.open();
  await pageObjects.orgFacade.waitForElements();
  await pageObjects.orgFacade.navigateToTeamsTab();
  await visualTester.verifyPage(page, "organization-teams-default.png", {
    mask: pageObjects.orgFacade.getVolatileRegions(),
  });

  const newTeam = await pageObjects.orgFacade.navigateToNewTeam();
  await visualTester.verifyPage(page, "organization-new-team-form.png", {
    mask: pageObjects.orgFacade.getVolatileRegions(),
  });

  await newTeam.enterTeamName(teamName);
  await newTeam.selectVisibility("private");
  await newTeam.selectRepoCodeAccess("write");
  await visualTester.verifyPage(page, "organization-new-team-form-filled.png", {
    mask: pageObjects.orgFacade.getVolatileRegions(),
  });

  await pageObjects.orgFacade.createTeam(teamName);
  await visualTester.verifyPage(page, "organization-team.png", {
    mask: pageObjects.orgFacade.getVolatileRegions(),
  });
});
