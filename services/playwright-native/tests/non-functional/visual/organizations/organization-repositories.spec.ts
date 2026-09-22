import { OrgTab } from "@gitea-automation/business-logic/pages/organizations/fragments/org-navigation.fragment";
import { test } from "../../../../fixtures/visual.fixture";

test("Organizations smoke: browse the repositories and members of an organization", async ({
  page,
  pageObjects,
  clients,
  scenarioState,
  sessionManager,
  visualTester,
}, testInfo) => {
  const organization = await clients.organizations.createOrganization(
    `at-vis-repos-${testInfo.project.name}`,
  );
  scenarioState.organization = organization;
  await clients.repositories.createOrganizationRepository(organization.name, "at-vis-repo-a");
  await clients.repositories.createOrganizationRepository(organization.name, "at-vis-repo-b");
  await sessionManager.loginAsOwner();

  await pageObjects.orgFacade.open();
  await pageObjects.orgFacade.waitForElements();
  const repositories = await pageObjects.orgFacade.navigateToRepositoriesTab();
  await visualTester.verifyPage(page, "organization-repositories.png", {
    mask: pageObjects.orgFacade.getVolatileRegions(),
    maxDiffPixels: 400,
  });

  await repositories.clickNewRepositoryButton();
  await pageObjects.createRepositoryPage.waitForElements();
  await visualTester.verifyPage(page, "organization-new-repository-form.png", {
    mask: pageObjects.createRepositoryPage.getVolatileRegions(),
  });

  await pageObjects.orgFacade.open();
  await pageObjects.orgFacade.waitForElements();
  await pageObjects.orgNavigation.navigateToTab(OrgTab.Members);
  await visualTester.verifyPage(page, "organization-members.png", {
    mask: pageObjects.orgFacade.getVolatileRegions(),
  });
});
