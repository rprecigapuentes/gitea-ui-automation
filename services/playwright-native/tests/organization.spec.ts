import {
  test,
  expect,
  ORGANIZATION_NAME_PREFIX,
  ORGANIZATION_TAG,
} from "../fixtures/hooks-fixtures";
import { resolveInvitedCredentials, resolveOwnerCredentials } from "../fixtures/credentials";
import { OrgTab } from "@gitea-automation/business-logic/pages/organizations/fragments/org-navigation.fragment";
import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";
import type { Team } from "@gitea-automation/business-logic/entities/team.entity";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";

test.describe("Organization test", () => {
  test(
    "should create an organization and add members",
    { tag: ORGANIZATION_TAG },
    async (
      { pageObjects, scenarioState, sessionManager, cleanupOrganizationsBeforeRun },
      testInfo,
    ) => {
      // Requested so its setup runs before the test; there is nothing to call.
      void cleanupOrganizationsBeforeRun;
      test.setTimeout(120_000);

      const owner = resolveOwnerCredentials(testInfo.project.name);
      const invited = resolveInvitedCredentials(testInfo.project.name);
      const { mainPage, navBar, createOrganizationPage } = pageObjects;
      const organizationToCreate: Organization = {
        name: `${ORGANIZATION_NAME_PREFIX}-${Date.now()}-${testInfo.project.name}-${uniqueSuffix()}`,
        visibility: "private",
        permissions: "true",
      };
      const team1ToCreate: Team = {
        name: `test-team-1-${Date.now()}-${uniqueSuffix()}`,
        visibility: "private",
        createRepositories: true,
        permissions: "general",
      };
      const team2ToCreate: Team = {
        name: `test-team-2-${Date.now()}-${uniqueSuffix()}`,
        visibility: "private",
        createRepositories: true,
        permissions: "general",
      };

      await test.step("Owner: Login with user 1 credentials", async () => {
        await sessionManager.loginAsOwner();
        await mainPage.open();
        expect(await mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await navBar.isVisibleOnMainPage(owner.username)).toBe(true);
        expect(await navBar.getCurrentOrganization()).toBe(owner.username);
        await navBar.clickOrganizationsDropdown();
      });

      await test.step("Owner: Creates new organization", async () => {
        await navBar.clickNewOrganizationDropdownOption();
        expect(await createOrganizationPage.hasExpectedFormElements()).toBe(true);
        expect(await createOrganizationPage.hasDefaultFormState()).toBe(true);
        await createOrganizationPage.enterOrganizationName(organizationToCreate.name);
        await createOrganizationPage.selectVisibility(organizationToCreate.visibility);
        await createOrganizationPage.clickCreateOrganizationButton();
        expect(await navBar.waitForElements()).toBe(true);
        scenarioState.organization = organizationToCreate;
        expect(await navBar.areOrgDashboardElementsVisible()).toBe(true);
        expect(await navBar.getViewOrganizationButtonText()).toContain(organizationToCreate.name);
      });

      // The facade needs the organization in scenarioState, so these are read only now.
      const { orgNavigation, orgRepositories, orgTeams, orgNewTeam, orgSpecificTeam, orgFacade } =
        pageObjects;

      await test.step("Navigate to created organization", async () => {
        await navBar.clickViewOrganizationButton();
        expect(await orgNavigation.areOwnerElementsVisible()).toBe(true);
        expect(await orgNavigation.hasOrganizationNameDisplayed(organizationToCreate.name)).toBe(
          true,
        );
        expect(await orgNavigation.isTabSelected(OrgTab.Repos)).toBe(true);
        expect(await orgNavigation.getTabCount(OrgTab.Members)).toBe("1");
        expect(await orgNavigation.getTabCount(OrgTab.Teams)).toBe("1");
        expect(await orgRepositories.areOwnerElementsVisible()).toBe(true);
        expect(await orgRepositories.getMembersCount()).toBe("1");
        expect(await orgRepositories.getMemberAvatarsCount()).toBe(1);
        expect(await orgRepositories.hasMemberAvatar(owner.username)).toBe(true);
        expect(await orgRepositories.getOwnersMembersCount()).toBe("1");
        expect(await orgRepositories.getOwnersRepositoriesCount()).toBe("0");
        expect(await orgRepositories.hasNewTeamButton()).toBe(true);
      });

      expect(orgFacade.getUrl()).toBe(await orgFacade.getCurrentUrl());

      await test.step("Navigate to Teams", async () => {
        await orgFacade.navigateToTeamsTab();
        expect(await orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await orgTeams.areOwnerElementsVisible()).toBe(true);
        expect(await orgTeams.getTeamContainersCount()).toBe(1);
        expect(await orgTeams.hasTeamContainer("Owners")).toBe(true);
        expect(await orgTeams.getTeamMembersCount("Owners")).toBe("1 members");
        expect(await orgTeams.getTeamAvatarsCount("Owners")).toBe(1);
        expect(await orgTeams.hasTeamAvatar("Owners", owner.username)).toBe(true);
      });

      await test.step("Create private team 1", async () => {
        await orgFacade.navigateToNewTeam();
        expect(await orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await orgNewTeam.waitForElements()).toBe(true);
        expect(await orgNewTeam.hasDefaultFormState()).toBe(true);
        await orgNewTeam.enterTeamName(team1ToCreate.name);
        await orgNewTeam.selectVisibility(team1ToCreate.visibility);
        await orgNewTeam.enableCreateRepositories();
        scenarioState.team1 = team1ToCreate;
        await orgFacade.createTeam(team1ToCreate.name);
        expect(await orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await orgNavigation.getTabCount(OrgTab.Teams)).toBe("2");
        expect(await orgSpecificTeam.isVisibleForOwner()).toBe(true);
        expect(await orgSpecificTeam.hasTeamNameDisplayed(team1ToCreate.name)).toBe(true);
        expect(await orgSpecificTeam.getMembersCount()).toBe("0");
        expect(await orgSpecificTeam.getRepositoriesCount()).toBe("0");
      });

      await test.step("Return to Teams after creating team 1", async () => {
        await orgFacade.navigateToTeamsTab();
        expect(await orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await orgNavigation.getTabCount(OrgTab.Teams)).toBe("2");
        expect(await orgTeams.getTeamContainersCount()).toBe(2);
        expect(await orgTeams.hasTeamContainer("Owners")).toBe(true);
        expect(await orgTeams.hasTeamContainer(team1ToCreate.name)).toBe(true);
        expect(await orgTeams.getTeamMembersCount("Owners")).toBe("1 members");
        expect(await orgTeams.getTeamMembersCount(team1ToCreate.name)).toBe("0 members");
        expect(await orgTeams.hasAddTeamMemberLink(team1ToCreate.name)).toBe(true);
      });

      await test.step("Create private team 2", async () => {
        await orgFacade.navigateToNewTeam();
        expect(await orgNewTeam.hasDefaultFormState()).toBe(true);
        await orgNewTeam.enterTeamName(team2ToCreate.name);
        await orgNewTeam.selectVisibility(team2ToCreate.visibility);
        await orgNewTeam.enableCreateRepositories();
        scenarioState.team2 = team2ToCreate;
        await orgFacade.createTeam(team2ToCreate.name);
        expect(await orgNavigation.getTabCount(OrgTab.Teams)).toBe("3");
        expect(await orgSpecificTeam.isVisibleForOwner()).toBe(true);
        expect(await orgSpecificTeam.hasTeamNameDisplayed(team2ToCreate.name)).toBe(true);
        expect(await orgSpecificTeam.hasPrivateVisibility()).toBe(true);
        expect(await orgSpecificTeam.getMembersCount()).toBe("0");
        expect(await orgSpecificTeam.getRepositoriesCount()).toBe("0");
        expect(await orgSpecificTeam.hasEmptyMembersMessage()).toBe(true);
      });

      await test.step("Return to Teams after creating team 2", async () => {
        await orgFacade.navigateToTeamsTab();
        expect(await orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await orgNavigation.getTabCount(OrgTab.Teams)).toBe("3");
        expect(await orgTeams.getTeamContainersCount()).toBe(3);
        expect(await orgTeams.getTeamMembersCount("Owners")).toBe("1 members");
        expect(await orgTeams.getTeamMembersCount(team1ToCreate.name)).toBe("0 members");
        expect(await orgTeams.hasAddTeamMemberLink(team1ToCreate.name)).toBe(true);
        expect(await orgTeams.getTeamMembersCount(team2ToCreate.name)).toBe("0 members");
        expect(await orgTeams.hasAddTeamMemberLink(team2ToCreate.name)).toBe(true);
      });

      await test.step("Open Team 1 to add user 2", async () => {
        await orgFacade.navigateToSpecificTeam(team1ToCreate.name);
        expect(await orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await orgNavigation.getTabCount(OrgTab.Teams)).toBe("3");
        expect(await orgSpecificTeam.isVisibleForOwner()).toBe(true);
        expect(await orgSpecificTeam.hasTeamNameDisplayed(team1ToCreate.name)).toBe(true);
        expect(await orgSpecificTeam.hasPrivateVisibility()).toBe(true);
        expect(await orgSpecificTeam.getMembersCount()).toBe("0");
        expect(await orgSpecificTeam.getRepositoriesCount()).toBe("0");
        expect(await orgSpecificTeam.hasEmptyMembersMessage()).toBe(true);
      });

      await test.step("Add user 2 to Team 1", async () => {
        const user2SearchQuery = invited.username.slice(0, 2);

        await orgSpecificTeam.searchUsers(user2SearchQuery);
        expect(await orgSpecificTeam.hasUserSearchResults()).toBe(true);
        expect(await orgSpecificTeam.hasOnlyMatchingUserSearchResults(user2SearchQuery)).toBe(true);
        expect(await orgSpecificTeam.hasUserSearchResult(invited.username)).toBe(true);
        await orgSpecificTeam.selectUser(invited.username);
        expect(await orgSpecificTeam.hasSelectedUser(invited.username)).toBe(true);
        await orgSpecificTeam.addSelectedUser();
        expect(await orgSpecificTeam.getMembersCount()).toBe("1");
        expect(await orgSpecificTeam.hasNoEmptyMembersMessage()).toBe(true);
        expect(await orgSpecificTeam.hasMember(invited.username)).toBe(true);
        expect(await orgSpecificTeam.hasRemoveTeamMemberButton(invited.username)).toBe(true);
        expect(await orgNavigation.getTabCount(OrgTab.Members)).toBe("2");
      });

      await test.step("Return to Teams after adding user 2", async () => {
        await orgFacade.navigateToTeamsTab();
        expect(await orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await orgNavigation.getTabCount(OrgTab.Teams)).toBe("3");
        expect(await orgTeams.getTeamMembersCount("Owners")).toBe("1 members");
        expect(await orgTeams.getTeamMembersCount(team1ToCreate.name)).toBe("1 members");
        expect(await orgTeams.hasTeamAvatar(team1ToCreate.name, invited.username)).toBe(true);
        expect(await orgTeams.doesNotHaveAddTeamMemberLink(team1ToCreate.name)).toBe(true);
        expect(await orgTeams.getTeamMembersCount(team2ToCreate.name)).toBe("0 members");
        expect(await orgTeams.hasAddTeamMemberLink(team2ToCreate.name)).toBe(true);
      });

      await test.step("Owner removes user 2 from Team 1", async () => {
        await orgFacade.navigateToSpecificTeam(team1ToCreate.name);
        expect(await orgSpecificTeam.hasRemoveTeamMemberButton(invited.username)).toBe(true);
        await orgSpecificTeam.clickRemoveTeamMemberButton(invited.username);
        expect(await orgSpecificTeam.isRemoveTeamMemberModalDisplayed()).toBe(true);
        await orgSpecificTeam.confirmRemoveTeamMember();
        expect(await orgSpecificTeam.isRemoveTeamMemberModalHidden()).toBe(true);
        expect(await orgSpecificTeam.getMembersCount()).toBe("0");
        expect(await orgSpecificTeam.hasEmptyMembersMessage()).toBe(true);
        expect(await orgNavigation.getTabCount(OrgTab.Members)).toBe("1");
        expect(await orgNavigation.getTabCount(OrgTab.Teams)).toBe("3");
      });

      await test.step("Owner reviews persisted Teams state", async () => {
        await orgFacade.navigateToTeamsTab();
        expect(await orgNavigation.getTabCount(OrgTab.Teams)).toBe("3");
        expect(await orgTeams.getTeamMembersCount("Owners")).toBe("1 members");
        expect(await orgTeams.getTeamMembersCount(team1ToCreate.name)).toBe("0 members");
        expect(await orgTeams.hasAddTeamMemberLink(team1ToCreate.name)).toBe(true);
        expect(await orgTeams.getTeamMembersCount(team2ToCreate.name)).toBe("0 members");
        expect(await orgTeams.hasAddTeamMemberLink(team2ToCreate.name)).toBe(true);
      });

      await test.step("Owner logs out", async () => {
        await sessionManager.logout();
      });
    },
  );
});
