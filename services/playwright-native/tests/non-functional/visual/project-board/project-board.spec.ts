import { test } from "../../../../fixtures/visual.fixture";

test("Project board smoke: create a project and see its board with cards", async ({
  page,
  pageObjects,
  clients,
  scenarioState,
  sessionManager,
  visualTester,
}, testInfo) => {
  const organization = await clients.organizations.createOrganization(
    `at-vis-board-${testInfo.project.name}`,
  );
  scenarioState.organization = organization;
  const repository = "at-vis-repo";
  await clients.repositories.createOrganizationRepository(organization.name, repository);
  const issues = [
    await clients.issues.createIssue(organization.name, repository, "At-vis card one"),
    await clients.issues.createIssue(organization.name, repository, "At-vis card two"),
  ];
  await sessionManager.loginAsOwner();

  await pageObjects.createProjectPage.openFor(organization.name);
  await visualTester.verifyPage(page, "project-board-create-form.png", {
    mask: pageObjects.createProjectPage.getVolatileRegions(),
  });

  await pageObjects.createProjectPage.createFromBasicKanban("At-vis project");
  await pageObjects.projectListPage.openFor(organization.name);
  await visualTester.verifyPage(page, "project-board-list.png", {
    mask: pageObjects.projectListPage.getVolatileRegions(),
  });
  const projectId = await pageObjects.projectListPage.getOnlyProjectId();

  for (const issue of issues) {
    await pageObjects.issuePage.openFor(organization.name, repository, issue.number);
    await pageObjects.issuePage.assignProject(projectId);
  }

  await pageObjects.projectBoardPage.openFor(organization.name, projectId);
  await visualTester.verifyPage(page, "project-board.png", {
    mask: pageObjects.projectBoardPage.getVolatileRegions(),
    maxDiffPixels: 2000,
  });
});
