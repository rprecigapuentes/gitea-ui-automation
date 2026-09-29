import { test, expect, SMOKE_TAG, TEAM_REPOSITORY_TAG } from "../fixtures/organizations-fixtures";
import { resolveInvitedCredentials } from "@gitea-automation/shared-playwright/credentials";
import type { PageFactory } from "@gitea-automation/business-logic/pages/page.factory";
import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";
import type { Team } from "@gitea-automation/business-logic/entities/team.entity";
import type { Repository } from "@gitea-automation/business-logic/entities/repository.entity";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";

// The step both team smokes share: "I create the following teams".
async function createTeam(pageObjects: PageFactory, team: Team): Promise<void> {
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
}

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

      await createTeam(pageObjects, team);

      expect(await pageObjects.orgSpecificTeam.waitForElements()).toBe(true);
    },
  );

  test(
    "Add a user to a team",
    { tag: SMOKE_TAG },
    async ({ pageObjects, sessionManager, existingOrganization }, testInfo) => {
      const { username } = resolveInvitedCredentials(testInfo.project.name);
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

      await createTeam(pageObjects, team);

      await pageObjects.orgFacade.navigateToTeamsTab();
      expect(await pageObjects.orgTeams.hasTeamContainer(team.name)).toBe(true);
      // +1 for the organization's own default "Owners" team.
      expect(await pageObjects.orgTeams.getTeamContainersCount()).toBe(2);

      await pageObjects.orgFacade.navigateToSpecificTeam(team.name);
      await pageObjects.orgSpecificTeam.addMemberByUsername(username);
      expect(await pageObjects.orgSpecificTeam.hasMember(username)).toBe(true);
      await pageObjects.orgFacade.navigateToTeamsTab();

      expect(await pageObjects.orgTeams.getTeamMembersCount(team.name)).toBe("1 members");
      expect(await pageObjects.orgTeams.getTeamAvatarUsernames(team.name)).toEqual([username]);
    },
  );

  test(
    "Create a repository for an existing organization",
    { tag: SMOKE_TAG },
    async ({ pageObjects, sessionManager, existingOrganization }) => {
      const repository: Repository = { name: "frontend", visibility: true };

      await sessionManager.loginAsOwner();
      await pageObjects.orgFacade.open();
      await pageObjects.orgFacade.waitForElements();
      expect(
        await pageObjects.orgNavigation.hasOrganizationNameDisplayed(existingOrganization.name),
      ).toBe(true);

      await pageObjects.orgFacade.navigateToRepositoriesTab();
      await pageObjects.orgRepositories.clickNewRepositoryButton();
      await pageObjects.createRepositoryPage.waitForElements();
      await pageObjects.createRepositoryPage.createRepository(
        repository.name,
        repository.visibility!,
      );

      await pageObjects.repoNavBar.waitForElements();
      await pageObjects.repoCodeTab.waitForElements(existingOrganization.name, repository.name);
      const title = await pageObjects.repoNavBar.getRepoTitle();
      expect(title).toContain(existingOrganization.name);
      expect(title).toContain(repository.name);

      await pageObjects.repoNavBar.clickOrganizationLink();
      await pageObjects.orgRepositories.waitForElements();

      expect(await pageObjects.orgRepositories.getOwnersRepositoriesCount()).toBe("1");
      expect(await pageObjects.orgRepositories.getRepositoryNames()).toContain(repository.name);
    },
  );

  test(
    "Add a repository to a team",
    { tag: [SMOKE_TAG, TEAM_REPOSITORY_TAG] },
    async ({ pageObjects, sessionManager, seededOrganizationWithTeamAndRepository }) => {
      const { teamName, repositoryName } = seededOrganizationWithTeamAndRepository!;

      await sessionManager.loginAsOwner();
      await pageObjects.orgFacade.open();
      await pageObjects.orgFacade.waitForElements();

      await pageObjects.orgFacade.navigateToTeamsTab();
      await pageObjects.orgFacade.navigateToSpecificTeam(teamName);
      await pageObjects.orgSpecificTeam.navigateToRepositoriesTab();
      await pageObjects.orgSpecificTeam.addRepository(repositoryName);
      await pageObjects.orgFacade.navigateToTeamsTab();

      await pageObjects.orgFacade.navigateToSpecificTeam(teamName);
      await pageObjects.orgSpecificTeam.navigateToRepositoriesTab();
      expect(await pageObjects.orgSpecificTeam.getAssignedRepositoryNames()).toEqual([
        repositoryName,
      ]);
    },
  );
});
