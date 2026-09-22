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
    async ({ pageObjects, scenarioState, sessionManager }, testInfo) => {
      const owner = resolveOwnerCredentials(testInfo.project.name);
      const invited = resolveInvitedCredentials(testInfo.project.name);
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
        await pageObjects.mainPage.open();
        expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await pageObjects.navBar.isVisibleOnMainPage(owner.username)).toBe(true);
        expect(await pageObjects.navBar.getCurrentOrganization()).toBe(owner.username);
        await pageObjects.navBar.clickOrganizationsDropdown();
      });

      await test.step("Owner: Creates new organization", async () => {
        await pageObjects.navBar.clickNewOrganizationDropdownOption();
        expect(await pageObjects.createOrganizationPage.hasExpectedFormElements()).toBe(true);
        expect(await pageObjects.createOrganizationPage.hasDefaultFormState()).toBe(true);
        await pageObjects.createOrganizationPage.enterOrganizationName(organizationToCreate.name);
        await pageObjects.createOrganizationPage.selectVisibility(organizationToCreate.visibility);
        await pageObjects.createOrganizationPage.clickCreateOrganizationButton();
        expect(await pageObjects.navBar.waitForElements()).toBe(true);
        scenarioState.organization = organizationToCreate;
        expect(await pageObjects.navBar.areOrgDashboardElementsVisible()).toBe(true);
        expect(await pageObjects.navBar.getViewOrganizationButtonText()).toContain(
          organizationToCreate.name,
        );
      });

      await test.step("Navigate to created organization", async () => {
        await pageObjects.navBar.clickViewOrganizationButton();
        expect(await pageObjects.orgNavigation.areOwnerElementsVisible()).toBe(true);
        expect(
          await pageObjects.orgNavigation.hasOrganizationNameDisplayed(organizationToCreate.name),
        ).toBe(true);
        expect(await pageObjects.orgNavigation.isTabSelected(OrgTab.Repos)).toBe(true);
        expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Members)).toBe("1");
        expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Teams)).toBe("1");
        expect(await pageObjects.orgRepositories.areOwnerElementsVisible()).toBe(true);
        expect(await pageObjects.orgRepositories.getMembersCount()).toBe("1");
        expect(await pageObjects.orgRepositories.getMemberAvatarsCount()).toBe(1);
        expect(await pageObjects.orgRepositories.hasMemberAvatar(owner.username)).toBe(true);
        expect(await pageObjects.orgRepositories.getOwnersMembersCount()).toBe("1");
        expect(await pageObjects.orgRepositories.getOwnersRepositoriesCount()).toBe("0");
        expect(await pageObjects.orgRepositories.hasNewTeamButton()).toBe(true);
      });

      expect(pageObjects.orgFacade.getUrl()).toBe(await pageObjects.orgFacade.getCurrentUrl());

      await test.step("Navigate to Teams", async () => {
        await pageObjects.orgFacade.navigateToTeamsTab();
        expect(await pageObjects.orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await pageObjects.orgTeams.areOwnerElementsVisible()).toBe(true);
        expect(await pageObjects.orgTeams.getTeamContainersCount()).toBe(1);
        expect(await pageObjects.orgTeams.hasTeamContainer("Owners")).toBe(true);
        expect(await pageObjects.orgTeams.getTeamMembersCount("Owners")).toBe("1 members");
        expect(await pageObjects.orgTeams.getTeamAvatarsCount("Owners")).toBe(1);
        expect(await pageObjects.orgTeams.hasTeamAvatar("Owners", owner.username)).toBe(true);
      });

      await test.step("Create private team 1", async () => {
        await pageObjects.orgFacade.navigateToNewTeam();
        expect(await pageObjects.orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await pageObjects.orgNewTeam.waitForElements()).toBe(true);
        expect(await pageObjects.orgNewTeam.hasDefaultFormState()).toBe(true);
        await pageObjects.orgNewTeam.enterTeamName(team1ToCreate.name);
        await pageObjects.orgNewTeam.selectVisibility(team1ToCreate.visibility);
        await pageObjects.orgNewTeam.enableCreateRepositories();
        scenarioState.team1 = team1ToCreate;
        await pageObjects.orgFacade.createTeam(team1ToCreate.name);
        expect(await pageObjects.orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Teams)).toBe("2");
        expect(await pageObjects.orgSpecificTeam.isVisibleForOwner()).toBe(true);
        expect(await pageObjects.orgSpecificTeam.hasTeamNameDisplayed(team1ToCreate.name)).toBe(
          true,
        );
        expect(await pageObjects.orgSpecificTeam.getMembersCount()).toBe("0");
        expect(await pageObjects.orgSpecificTeam.getRepositoriesCount()).toBe("0");
      });

      await test.step("Return to Teams after creating team 1", async () => {
        await pageObjects.orgFacade.navigateToTeamsTab();
        expect(await pageObjects.orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Teams)).toBe("2");
        expect(await pageObjects.orgTeams.getTeamContainersCount()).toBe(2);
        expect(await pageObjects.orgTeams.hasTeamContainer("Owners")).toBe(true);
        expect(await pageObjects.orgTeams.hasTeamContainer(team1ToCreate.name)).toBe(true);
        expect(await pageObjects.orgTeams.getTeamMembersCount("Owners")).toBe("1 members");
        expect(await pageObjects.orgTeams.getTeamMembersCount(team1ToCreate.name)).toBe(
          "0 members",
        );
        expect(await pageObjects.orgTeams.hasAddTeamMemberLink(team1ToCreate.name)).toBe(true);
      });

      await test.step("Create private team 2", async () => {
        await pageObjects.orgFacade.navigateToNewTeam();
        expect(await pageObjects.orgNewTeam.hasDefaultFormState()).toBe(true);
        await pageObjects.orgNewTeam.enterTeamName(team2ToCreate.name);
        await pageObjects.orgNewTeam.selectVisibility(team2ToCreate.visibility);
        await pageObjects.orgNewTeam.enableCreateRepositories();
        scenarioState.team2 = team2ToCreate;
        await pageObjects.orgFacade.createTeam(team2ToCreate.name);
        expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Teams)).toBe("3");
        expect(await pageObjects.orgSpecificTeam.isVisibleForOwner()).toBe(true);
        expect(await pageObjects.orgSpecificTeam.hasTeamNameDisplayed(team2ToCreate.name)).toBe(
          true,
        );
        expect(await pageObjects.orgSpecificTeam.hasPrivateVisibility()).toBe(true);
        expect(await pageObjects.orgSpecificTeam.getMembersCount()).toBe("0");
        expect(await pageObjects.orgSpecificTeam.getRepositoriesCount()).toBe("0");
        expect(await pageObjects.orgSpecificTeam.hasEmptyMembersMessage()).toBe(true);
      });

      await test.step("Return to Teams after creating team 2", async () => {
        await pageObjects.orgFacade.navigateToTeamsTab();
        expect(await pageObjects.orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Teams)).toBe("3");
        expect(await pageObjects.orgTeams.getTeamContainersCount()).toBe(3);
        expect(await pageObjects.orgTeams.getTeamMembersCount("Owners")).toBe("1 members");
        expect(await pageObjects.orgTeams.getTeamMembersCount(team1ToCreate.name)).toBe(
          "0 members",
        );
        expect(await pageObjects.orgTeams.hasAddTeamMemberLink(team1ToCreate.name)).toBe(true);
        expect(await pageObjects.orgTeams.getTeamMembersCount(team2ToCreate.name)).toBe(
          "0 members",
        );
        expect(await pageObjects.orgTeams.hasAddTeamMemberLink(team2ToCreate.name)).toBe(true);
      });

      await test.step("Open Team 1 to add user 2", async () => {
        await pageObjects.orgFacade.navigateToSpecificTeam(team1ToCreate.name);
        expect(await pageObjects.orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Teams)).toBe("3");
        expect(await pageObjects.orgSpecificTeam.isVisibleForOwner()).toBe(true);
        expect(await pageObjects.orgSpecificTeam.hasTeamNameDisplayed(team1ToCreate.name)).toBe(
          true,
        );
        expect(await pageObjects.orgSpecificTeam.hasPrivateVisibility()).toBe(true);
        expect(await pageObjects.orgSpecificTeam.getMembersCount()).toBe("0");
        expect(await pageObjects.orgSpecificTeam.getRepositoriesCount()).toBe("0");
        expect(await pageObjects.orgSpecificTeam.hasEmptyMembersMessage()).toBe(true);
      });

      await test.step("Add user 2 to Team 1", async () => {
        const user2SearchQuery = invited.username.slice(0, 2);

        await pageObjects.orgSpecificTeam.searchUsers(user2SearchQuery);
        expect(await pageObjects.orgSpecificTeam.hasUserSearchResults()).toBe(true);
        expect(
          await pageObjects.orgSpecificTeam.hasOnlyMatchingUserSearchResults(user2SearchQuery),
        ).toBe(true);
        expect(await pageObjects.orgSpecificTeam.hasUserSearchResult(invited.username)).toBe(true);
        await pageObjects.orgSpecificTeam.selectUser(invited.username);
        expect(await pageObjects.orgSpecificTeam.hasSelectedUser(invited.username)).toBe(true);
        await pageObjects.orgSpecificTeam.addSelectedUser();
        expect(await pageObjects.orgSpecificTeam.getMembersCount()).toBe("1");
        expect(await pageObjects.orgSpecificTeam.hasNoEmptyMembersMessage()).toBe(true);
        expect(await pageObjects.orgSpecificTeam.hasMember(invited.username)).toBe(true);
        expect(await pageObjects.orgSpecificTeam.hasRemoveTeamMemberButton(invited.username)).toBe(
          true,
        );
        expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Members)).toBe("2");
      });

      await test.step("Return to Teams after adding user 2", async () => {
        await pageObjects.orgFacade.navigateToTeamsTab();
        expect(await pageObjects.orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Teams)).toBe("3");
        expect(await pageObjects.orgTeams.getTeamMembersCount("Owners")).toBe("1 members");
        expect(await pageObjects.orgTeams.getTeamMembersCount(team1ToCreate.name)).toBe(
          "1 members",
        );
        expect(await pageObjects.orgTeams.hasTeamAvatar(team1ToCreate.name, invited.username)).toBe(
          true,
        );
        expect(await pageObjects.orgTeams.doesNotHaveAddTeamMemberLink(team1ToCreate.name)).toBe(
          true,
        );
        expect(await pageObjects.orgTeams.getTeamMembersCount(team2ToCreate.name)).toBe(
          "0 members",
        );
        expect(await pageObjects.orgTeams.hasAddTeamMemberLink(team2ToCreate.name)).toBe(true);
      });

      await test.step("Owner removes user 2 from Team 1", async () => {
        await pageObjects.orgFacade.navigateToSpecificTeam(team1ToCreate.name);
        expect(await pageObjects.orgSpecificTeam.hasRemoveTeamMemberButton(invited.username)).toBe(
          true,
        );
        await pageObjects.orgSpecificTeam.clickRemoveTeamMemberButton(invited.username);
        expect(await pageObjects.orgSpecificTeam.isRemoveTeamMemberModalDisplayed()).toBe(true);
        await pageObjects.orgSpecificTeam.confirmRemoveTeamMember();
        expect(await pageObjects.orgSpecificTeam.isRemoveTeamMemberModalHidden()).toBe(true);
        expect(await pageObjects.orgSpecificTeam.getMembersCount()).toBe("0");
        expect(await pageObjects.orgSpecificTeam.hasEmptyMembersMessage()).toBe(true);
        expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Members)).toBe("1");
        expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Teams)).toBe("3");
      });

      await test.step("Owner reviews persisted Teams state", async () => {
        await pageObjects.orgFacade.navigateToTeamsTab();
        expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Teams)).toBe("3");
        expect(await pageObjects.orgTeams.getTeamMembersCount("Owners")).toBe("1 members");
        expect(await pageObjects.orgTeams.getTeamMembersCount(team1ToCreate.name)).toBe(
          "0 members",
        );
        expect(await pageObjects.orgTeams.hasAddTeamMemberLink(team1ToCreate.name)).toBe(true);
        expect(await pageObjects.orgTeams.getTeamMembersCount(team2ToCreate.name)).toBe(
          "0 members",
        );
        expect(await pageObjects.orgTeams.hasAddTeamMemberLink(team2ToCreate.name)).toBe(true);
      });

      await test.step("Owner logs out", async () => {
        await sessionManager.logout();
      });
    },
  );
});
