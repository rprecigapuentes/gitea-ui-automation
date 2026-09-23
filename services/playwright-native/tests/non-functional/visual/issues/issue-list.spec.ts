import { test } from "../../../../fixtures/visual.fixture";

test("Issues smoke: the issue list and an issue", async ({
  page,
  pageObjects,
  clients,
  scenarioState,
  sessionManager,
  visualTester,
}, testInfo) => {
  const organization = await clients.organizations.createOrganization(
    `at-vis-issues-${testInfo.project.name}`,
  );
  scenarioState.organization = organization;
  const repository = "at-vis-repo";
  await clients.repositories.createOrganizationRepository(organization.name, repository);
  const issue = await clients.issues.createIssue(organization.name, repository, "At-vis issue one");
  await clients.issues.createIssue(organization.name, repository, "At-vis issue two");
  await sessionManager.loginAsOwner();

  await pageObjects.issueListPage.openFor(organization.name, repository);
  await visualTester.verifyPage(page, "issue-list.png", {
    mask: pageObjects.issueListPage.getVolatileRegions(),
    maxDiffPixels: 2400,
  });

  await pageObjects.issuePage.openFor(organization.name, repository, issue.number);
  await visualTester.verifyPage(page, "issue-detail.png", {
    mask: pageObjects.issuePage.getVolatileRegions(),
    maxDiffPixels: 2400,
  });
});
