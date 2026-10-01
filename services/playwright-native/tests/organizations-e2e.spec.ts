import {
  test,
  expect,
  ORGANIZATION_NAME_PREFIX,
  ORGANIZATION_TAG,
  E2E_TAG,
} from "../fixtures/organizations-fixtures";
import {
  resolveInvitedCredentials,
  resolveOwnerCredentials,
} from "@gitea-automation/shared-playwright/credentials";
import { OrgTab } from "@gitea-automation/business-logic/pages/organizations/fragments/org-navigation.fragment";
import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";
import type { Team } from "@gitea-automation/business-logic/entities/team.entity";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";

test.describe("Organizations e2e", () => {
  // Ported from the Vitest suite's organizations test, step for step.
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
        // A new organization already has one member, its creator, and one team, Owners.
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
        // A two-letter prefix, so the search returns a list to filter; selectUser types the rest.
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

  // Ported from the Cucumber suite's organizations feature.
  test(
    "Change team members permissions",
    { tag: E2E_TAG },
    async ({ pageObjects, scenarioState, sessionManager, seededUsers }, testInfo) => {
      const [user1, user2] = seededUsers;
      const organization: Organization = {
        name: `test-org-${testInfo.project.name}-${uniqueSuffix()}`,
        visibility: "public",
        permissions: "true",
      };

      await test.step("Owner creates the organization", async () => {
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
        expect(await pageObjects.navBar.getDropdownOrganizationsList()).toContain(
          organization.name,
        );
        expect(await pageObjects.navBar.getCurrentOrganization()).toBe(organization.name);
      });

      await test.step("Owner creates dev-team and qa-team", async () => {
        await pageObjects.navBar.clickViewOrganizationButton();
        expect(await pageObjects.orgRepositories.areOwnerElementsVisible()).toBe(true);
        expect(await pageObjects.orgNavigation.areOwnerElementsVisible()).toBe(true);

        await pageObjects.orgFacade.navigateToTeamsTab();
        await pageObjects.orgTeams.clickNewTeamButton();
        await pageObjects.orgNewTeam.waitForElements();
        await pageObjects.orgNewTeam.createTeam("dev-team", "private", "write", true);
        await pageObjects.orgSpecificTeam.waitForElements();
        await pageObjects.orgNavigation.waitForElements();

        await pageObjects.orgFacade.navigateToTeamsTab();
        await pageObjects.orgTeams.clickNewTeamButton();
        await pageObjects.orgNewTeam.waitForElements();
        await pageObjects.orgNewTeam.createTeam("qa-team", "private", "write", true);
        await pageObjects.orgSpecificTeam.waitForElements();
        await pageObjects.orgNavigation.waitForElements();

        await pageObjects.orgFacade.navigateToTeamsTab();
        expect(await pageObjects.orgTeams.hasTeamContainer("dev-team")).toBe(true);
        expect(await pageObjects.orgTeams.hasTeamContainer("qa-team")).toBe(true);
        // +1 for the organization's own default "Owners" team.
        expect(await pageObjects.orgTeams.getTeamContainersCount()).toBe(3);
      });

      await test.step("Owner adds user 1 to both teams and user 2 to qa-team", async () => {
        await pageObjects.orgFacade.navigateToTeamsTab();
        await pageObjects.orgFacade.navigateToSpecificTeam("dev-team");
        await pageObjects.orgSpecificTeam.addMemberByUsername(user1.username);
        expect(await pageObjects.orgSpecificTeam.hasMember(user1.username)).toBe(true);

        await pageObjects.orgFacade.navigateToTeamsTab();
        await pageObjects.orgFacade.navigateToSpecificTeam("qa-team");
        await pageObjects.orgSpecificTeam.addMemberByUsername(user1.username);
        expect(await pageObjects.orgSpecificTeam.hasMember(user1.username)).toBe(true);

        await pageObjects.orgFacade.navigateToTeamsTab();
        await pageObjects.orgFacade.navigateToSpecificTeam("qa-team");
        await pageObjects.orgSpecificTeam.addMemberByUsername(user2.username);
        expect(await pageObjects.orgSpecificTeam.hasMember(user2.username)).toBe(true);

        await pageObjects.orgFacade.navigateToTeamsTab();
        expect(await pageObjects.orgTeams.getTeamMembersCount("dev-team")).toBe("1 members");
        expect(await pageObjects.orgTeams.getTeamMembersCount("qa-team")).toBe("2 members");
        expect(await pageObjects.orgTeams.getTeamAvatarUsernames("dev-team")).toEqual([
          user1.username,
        ]);
        const qaTeamAvatars = await pageObjects.orgTeams.getTeamAvatarUsernames("qa-team");
        expect(qaTeamAvatars).toContain(user1.username);
        expect(qaTeamAvatars).toContain(user2.username);
        expect(qaTeamAvatars.length).toBe(2);
      });

      await test.step("Owner creates the monorepo repository and assigns it to both teams", async () => {
        await pageObjects.orgFacade.navigateToRepositoriesTab();
        await pageObjects.orgRepositories.clickNewRepositoryButton();
        await pageObjects.createRepositoryPage.waitForElements();
        await pageObjects.createRepositoryPage.createRepository("monorepo", true);
        await pageObjects.repoNavBar.waitForElements();
        await pageObjects.repoCodeTab.waitForElements(organization.name, "monorepo");
        const title = await pageObjects.repoNavBar.getRepoTitle();
        expect(title).toContain(organization.name);
        expect(title).toContain("monorepo");
        await pageObjects.repoNavBar.clickOrganizationLink();
        await pageObjects.orgRepositories.waitForElements();
        expect(await pageObjects.orgRepositories.getOwnersRepositoriesCount()).toBe("1");
        expect(await pageObjects.orgRepositories.getRepositoryNames()).toContain("monorepo");

        for (const teamName of ["dev-team", "qa-team"]) {
          await pageObjects.orgFacade.navigateToTeamsTab();
          await pageObjects.orgFacade.navigateToSpecificTeam(teamName);
          await pageObjects.orgSpecificTeam.navigateToRepositoriesTab();
          await pageObjects.orgSpecificTeam.addRepository("monorepo");
          expect(await pageObjects.orgSpecificTeam.getAssignedRepositoryNames()).toEqual([
            "monorepo",
          ]);
        }
      });

      await test.step("Owner adds a file to the repository", async () => {
        await pageObjects.orgFacade.navigateToRepositoriesTab();
        const ownerFileName = `${organization.name}-owner-${uniqueSuffix()}`;
        await pageObjects.orgRepositories.clickRepository("monorepo");
        await pageObjects.repoNavBar.waitForElements();
        await pageObjects.repoCodeTab.waitForElements(organization.name, "monorepo");
        await pageObjects.repoCodeTab.clickNewFileButton();
        await pageObjects.createRepoFile.waitForElements(organization.name, "monorepo");
        await pageObjects.createRepoFile.fillFileName(ownerFileName);
        await pageObjects.createRepoFile.fillFileContent(
          await pageObjects.navBar.getCurrentUsername(),
        );
        await pageObjects.createRepoFile.clickCommitChangesButton();
        await pageObjects.repoFile.waitForElements(organization.name, "monorepo");
        expect(await pageObjects.repoFile.getFileName()).toBe(ownerFileName);

        await pageObjects.repoNavBar.clickOrganizationLink();
        await pageObjects.orgRepositories.waitForElements();
        await pageObjects.orgRepositories.clickRepository("monorepo");
        await pageObjects.repoNavBar.waitForElements();
        await pageObjects.repoCodeTab.waitForElements(organization.name, "monorepo");
        expect(await pageObjects.repoCodeTab.getFilesCount()).toBe(1);
        await pageObjects.repoNavBar.clickOrganizationLink();
        await pageObjects.orgRepositories.waitForElements();
      });

      await test.step("User 1 writes to the repository through either team", async () => {
        await sessionManager.loginAs(user1.username, user1.password);
        expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await pageObjects.navBar.waitForElements()).toBe(true);
        await pageObjects.orgFacade.open();
        await pageObjects.orgFacade.waitForElements();

        const user1FileName = `${organization.name}-user1-${uniqueSuffix()}`;
        await pageObjects.orgRepositories.clickRepository("monorepo");
        await pageObjects.repoNavBar.waitForElements();
        await pageObjects.repoCodeTab.waitForElements(organization.name, "monorepo");
        await pageObjects.repoCodeTab.clickNewFileButton();
        await pageObjects.createRepoFile.waitForElements(organization.name, "monorepo");
        await pageObjects.createRepoFile.fillFileName(user1FileName);
        await pageObjects.createRepoFile.fillFileContent(user1.username);
        await pageObjects.createRepoFile.clickCommitChangesButton();
        await pageObjects.repoFile.waitForElements(organization.name, "monorepo");
        expect(await pageObjects.repoFile.getFileName()).toBe(user1FileName);

        await pageObjects.repoNavBar.clickOrganizationLink();
        await pageObjects.orgRepositories.waitForElements();
        await pageObjects.orgRepositories.clickRepository("monorepo");
        await pageObjects.repoNavBar.waitForElements();
        await pageObjects.repoCodeTab.waitForElements(organization.name, "monorepo");
        expect(await pageObjects.repoCodeTab.getFilesCount()).toBe(2);
        await pageObjects.repoNavBar.clickOrganizationLink();
        await pageObjects.orgRepositories.waitForElements();
      });

      await test.step("Owner removes user 1 from dev-team, who keeps writing through qa-team", async () => {
        await sessionManager.loginAsOwner();
        expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await pageObjects.navBar.waitForElements()).toBe(true);
        await pageObjects.orgFacade.open();
        await pageObjects.orgFacade.waitForElements();

        await pageObjects.orgFacade.navigateToTeamsTab();
        await pageObjects.orgTeams.clickTeamName("dev-team");
        await pageObjects.orgSpecificTeam.waitForElements();
        expect(await pageObjects.orgSpecificTeam.hasRemoveTeamMemberButton(user1.username)).toBe(
          true,
        );
        await pageObjects.orgSpecificTeam.clickRemoveTeamMemberButton(user1.username);
        expect(await pageObjects.orgSpecificTeam.isRemoveTeamMemberModalDisplayed()).toBe(true);
        await pageObjects.orgSpecificTeam.confirmRemoveTeamMember();
        expect(await pageObjects.orgSpecificTeam.isRemoveTeamMemberModalHidden()).toBe(true);

        await pageObjects.orgFacade.navigateToTeamsTab();
        expect(await pageObjects.orgTeams.getTeamMembersCount("dev-team")).toBe("0 members");
        expect(await pageObjects.orgTeams.getTeamMembersCount("qa-team")).toBe("2 members");

        await sessionManager.loginAs(user1.username, user1.password);
        expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await pageObjects.navBar.waitForElements()).toBe(true);
        await pageObjects.orgFacade.open();
        await pageObjects.orgFacade.waitForElements();

        const user1SecondFileName = `${organization.name}-user1-${uniqueSuffix()}`;
        await pageObjects.orgRepositories.clickRepository("monorepo");
        await pageObjects.repoNavBar.waitForElements();
        await pageObjects.repoCodeTab.waitForElements(organization.name, "monorepo");
        await pageObjects.repoCodeTab.clickNewFileButton();
        await pageObjects.createRepoFile.waitForElements(organization.name, "monorepo");
        await pageObjects.createRepoFile.fillFileName(user1SecondFileName);
        await pageObjects.createRepoFile.fillFileContent(user1.username);
        await pageObjects.createRepoFile.clickCommitChangesButton();
        await pageObjects.repoFile.waitForElements(organization.name, "monorepo");
        expect(await pageObjects.repoFile.getFileName()).toBe(user1SecondFileName);

        await pageObjects.repoNavBar.clickOrganizationLink();
        await pageObjects.orgRepositories.waitForElements();
        await pageObjects.orgRepositories.clickRepository("monorepo");
        await pageObjects.repoNavBar.waitForElements();
        await pageObjects.repoCodeTab.waitForElements(organization.name, "monorepo");
        expect(await pageObjects.repoCodeTab.getFilesCount()).toBe(3);
        await pageObjects.repoNavBar.clickOrganizationLink();
        await pageObjects.orgRepositories.waitForElements();
      });

      await test.step("Owner gives qa-team read access, so user 2 is asked to fork", async () => {
        await sessionManager.loginAsOwner();
        expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await pageObjects.navBar.waitForElements()).toBe(true);
        await pageObjects.orgFacade.open();
        await pageObjects.orgFacade.waitForElements();

        await pageObjects.orgFacade.navigateToTeamsTab();
        await pageObjects.orgTeams.clickTeamName("qa-team");
        await pageObjects.orgSpecificTeam.waitForElements();
        await pageObjects.orgSpecificTeam.clickSettingsButton();
        await pageObjects.orgNewTeam.waitForEditElements();
        await pageObjects.orgNewTeam.selectRepoCodeAccess("read");
        await pageObjects.orgNewTeam.clickUpdateTeamButton();
        await pageObjects.orgSpecificTeam.waitForElements();

        await sessionManager.loginAs(user2.username, user2.password);
        expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await pageObjects.navBar.waitForElements()).toBe(true);
        await pageObjects.orgFacade.open();
        await pageObjects.orgFacade.waitForElements();

        await pageObjects.orgRepositories.clickRepository("monorepo");
        await pageObjects.repoNavBar.waitForElements();
        await pageObjects.repoCodeTab.waitForElements(organization.name, "monorepo");
        await pageObjects.repoCodeTab.clickNewFileButton();
        expect(await pageObjects.forkPrompt.waitForElements()).toBe(true);
        expect(await pageObjects.forkPrompt.getHeadingText()).toContain("Fork Repository");
      });

      await test.step("Owner removes qa-team code access, so user 1 no longer sees the Code tab", async () => {
        await sessionManager.loginAsOwner();
        expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await pageObjects.navBar.waitForElements()).toBe(true);
        await pageObjects.orgFacade.open();
        await pageObjects.orgFacade.waitForElements();

        await pageObjects.orgFacade.navigateToTeamsTab();
        await pageObjects.orgTeams.clickTeamName("qa-team");
        await pageObjects.orgSpecificTeam.waitForElements();
        await pageObjects.orgSpecificTeam.clickSettingsButton();
        await pageObjects.orgNewTeam.waitForEditElements();
        await pageObjects.orgNewTeam.selectRepoCodeAccess("none");
        await pageObjects.orgNewTeam.clickUpdateTeamButton();
        await pageObjects.orgSpecificTeam.waitForElements();

        await sessionManager.loginAs(user1.username, user1.password);
        expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await pageObjects.navBar.waitForElements()).toBe(true);
        await pageObjects.orgFacade.open();
        await pageObjects.orgFacade.waitForElements();

        await pageObjects.orgRepositories.clickRepository("monorepo");
        await pageObjects.repoNavBar.waitForElements();
        expect(await pageObjects.repoNavBar.isCodeTabVisible()).toBe(false);
        expect(await pageObjects.repoNavBar.isIssuesTabActiveByDefault()).toBe(true);
      });

      await test.step("Owner removes user 2, who can no longer reach the organization", async () => {
        await sessionManager.loginAsOwner();
        expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await pageObjects.navBar.waitForElements()).toBe(true);
        await pageObjects.orgFacade.open();
        await pageObjects.orgFacade.waitForElements();

        await pageObjects.orgFacade.navigateToTeamsTab();
        await pageObjects.orgTeams.clickTeamName("qa-team");
        await pageObjects.orgSpecificTeam.waitForElements();
        expect(await pageObjects.orgSpecificTeam.hasRemoveTeamMemberButton(user2.username)).toBe(
          true,
        );
        await pageObjects.orgSpecificTeam.clickRemoveTeamMemberButton(user2.username);
        expect(await pageObjects.orgSpecificTeam.isRemoveTeamMemberModalDisplayed()).toBe(true);
        await pageObjects.orgSpecificTeam.confirmRemoveTeamMember();
        expect(await pageObjects.orgSpecificTeam.isRemoveTeamMemberModalHidden()).toBe(true);

        await pageObjects.orgFacade.navigateToTeamsTab();
        // user1 is still a member of qa-team; only user2 was removed.
        expect(await pageObjects.orgTeams.getTeamMembersCount("qa-team")).toBe("1 members");

        await sessionManager.loginAs(user2.username, user2.password);
        expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await pageObjects.navBar.waitForElements()).toBe(true);
        await pageObjects.navBar.clickOrganizationsDropdown();
        const organizations = await pageObjects.navBar.getDropdownOrganizationsList();
        expect(organizations).not.toContain(organization.name);
        expect(organizations.length).toBe(1);
      });
    },
  );
});
