import { test, expect, E2E_TAG } from "../fixtures/hooks-fixtures";
import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";

test.describe("Organization", () => {
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
