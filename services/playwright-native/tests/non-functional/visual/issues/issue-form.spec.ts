import { test } from "../../../../fixtures/visual.fixture";

test("Issues smoke: the issue form with its labels and milestones", async ({
  page,
  pageObjects,
  clients,
  scenarioState,
  sessionManager,
  visualTester,
}, testInfo) => {
  const organization = await clients.organizations.createOrganization(
    `at-vis-form-${testInfo.project.name}`,
  );
  scenarioState.organization = organization;
  const repository = "at-vis-repo";
  await clients.repositories.createOrganizationRepository(organization.name, repository);
  const label = await clients.labels.createLabel(organization.name, repository, {
    name: "at-vis-label",
    color: "#d73a4a",
    exclusive: false,
  });
  const milestone = await clients.milestones.createMilestone(organization.name, repository, {
    title: "at-vis-milestone",
    description: "Milestone for the visual smoke",
    due_on: "2035-01-01T00:00:00Z",
  });
  await sessionManager.loginAsOwner();

  await pageObjects.createIssuePage.openFor(organization.name, repository);
  await visualTester.verifyPage(page, "issue-form.png", {
    mask: pageObjects.createIssuePage.getVolatileRegions(),
  });

  await pageObjects.createIssuePage.fillTitle("At-vis issue");
  await pageObjects.createIssuePage.fillDescription("## Heading\n\nA line of description.");
  await pageObjects.createIssuePage.selectLabel(label.id);
  await pageObjects.createIssuePage.selectMilestone(milestone.id);
  await visualTester.verifyPage(page, "issue-form-filled.png", {
    mask: pageObjects.createIssuePage.getVolatileRegions(),
  });

  await pageObjects.createIssuePage.openPreview();
  await visualTester.verifyPage(page, "issue-form-preview.png", {
    mask: pageObjects.createIssuePage.getVolatileRegions(),
  });

  await pageObjects.labelListPage.openFor(organization.name, repository);
  await visualTester.verifyPage(page, "issue-labels.png", {
    mask: pageObjects.labelListPage.getVolatileRegions(),
  });

  await pageObjects.milestoneListPage.openFor(organization.name, repository);
  await visualTester.verifyPage(page, "issue-milestones.png", {
    mask: pageObjects.milestoneListPage.getVolatileRegions(),
    maxDiffPixels: 550,
  });
});
