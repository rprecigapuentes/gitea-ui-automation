import { test, expect, SMOKE_TAG } from "../fixtures/hooks-fixtures";
import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";
import type { Team } from "@gitea-automation/business-logic/entities/team.entity";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";

test.describe("Organization smokes", () => {
  test(
    "Create Organization",
    { tag: SMOKE_TAG },
    async ({ pageObjects, scenarioState, sessionManager }, testInfo) => {
      const organization: Organization = {
        name: `test-org-${testInfo.project.name}-${uniqueSuffix()}`,
        visibility: "public",
        permissions: "true",
      };

      await sessionManager.loginAsOwner();
      await pageObjects.navBar.clickOrganizationsDropdown();
      await pageObjects.navBar.clickNewOrganizationDropdownOption();
      await pageObjects.createOrganizationPage.waitForElements();

      await pageObjects.createOrganizationPage.createOrganization(
        organization.name,
        organization.visibility,
        organization.permissions === "true",
      );
      scenarioState.organization = organization;
      await pageObjects.organizationDashboardPage.waitForElements(organization);
      expect(await pageObjects.navBar.waitForElements()).toBe(true);
      expect(await pageObjects.navBar.areOrgDashboardElementsVisible()).toBe(true);

      await pageObjects.navBar.clickOrganizationsDropdown();
      expect(await pageObjects.navBar.getDropdownOrganizationsList()).toContain(organization.name);
      expect(await pageObjects.navBar.getCurrentOrganization()).toBe(organization.name);
    },
  );

  test(
    "Create teams for an existing organization",
    { tag: SMOKE_TAG },
    async ({ pageObjects, sessionManager, existingOrganization }) => {
      const team: Team = {
        name: "team-1",
        visibility: "private",
        repoCodeAccess: "none",
        createRepositories: true,
        permissions: "general",
      };

      await sessionManager.loginAsOwner();
      await pageObjects.orgFacade.open();
      await pageObjects.orgFacade.waitForElements();
      expect(
        await pageObjects.orgNavigation.hasOrganizationNameDisplayed(existingOrganization.name),
      ).toBe(true);

      await pageObjects.orgFacade.navigateToTeamsTab();
      await pageObjects.orgTeams.clickNewTeamButton();
      await pageObjects.orgNewTeam.waitForElements();
      await pageObjects.orgNewTeam.createTeam(
        team.name,
        team.visibility,
        team.repoCodeAccess!,
        team.createRepositories,
      );
      await pageObjects.orgSpecificTeam.waitForElements();
      await pageObjects.orgNavigation.waitForElements();

      expect(await pageObjects.orgSpecificTeam.waitForElements()).toBe(true);
    },
  );
});
