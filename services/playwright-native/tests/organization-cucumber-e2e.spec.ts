import { test, expect, E2E_TAG } from "../fixtures/hooks-fixtures";
import type { SeededUser } from "../fixtures/hooks-fixtures";
import type { PageFactory } from "@gitea-automation/business-logic/pages/page.factory";
import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";
import type { Team } from "@gitea-automation/business-logic/entities/team.entity";
import type { Repository } from "@gitea-automation/business-logic/entities/repository.entity";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";

// The steps the scenario repeats, as they are named in organizations.feature.

async function openSeededOrganization(pageObjects: PageFactory): Promise<void> {
  await pageObjects.orgFacade.open();
  await pageObjects.orgFacade.waitForElements();
}

async function createTeam(pageObjects: PageFactory, organization: Organization, team: Team) {
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

  organization.teams!.push(team);
}

async function addTeamMember(
  pageObjects: PageFactory,
  organization: Organization,
  user: SeededUser,
  teamName: string,
) {
  await pageObjects.orgFacade.navigateToSpecificTeam(teamName);
  await pageObjects.orgSpecificTeam.addMemberByUsername(user.username);
  expect(await pageObjects.orgSpecificTeam.hasMember(user.username)).toBe(true);

  const team = organization.teams!.find((candidate) => candidate.name === teamName)!;
  team.users ??= [];
  team.users.push(user.username);

  await pageObjects.orgFacade.navigateToTeamsTab();
}

async function removeTeamMember(
  pageObjects: PageFactory,
  organization: Organization,
  user: SeededUser,
  teamName: string,
) {
  await pageObjects.orgFacade.navigateToTeamsTab();
  await pageObjects.orgTeams.clickTeamName(teamName);
  await pageObjects.orgSpecificTeam.waitForElements();
  expect(await pageObjects.orgSpecificTeam.hasRemoveTeamMemberButton(user.username)).toBe(true);
  await pageObjects.orgSpecificTeam.clickRemoveTeamMemberButton(user.username);
  expect(await pageObjects.orgSpecificTeam.isRemoveTeamMemberModalDisplayed()).toBe(true);
  await pageObjects.orgSpecificTeam.confirmRemoveTeamMember();
  expect(await pageObjects.orgSpecificTeam.isRemoveTeamMemberModalHidden()).toBe(true);

  const team = organization.teams!.find((candidate) => candidate.name === teamName)!;
  team.users = team.users?.filter((username) => username !== user.username) ?? [];

  await pageObjects.orgFacade.navigateToTeamsTab();
}

async function expectMemberCounts(pageObjects: PageFactory, organization: Organization) {
  await pageObjects.orgFacade.navigateToTeamsTab();

  for (const team of organization.teams ?? []) {
    expect(await pageObjects.orgTeams.getTeamMembersCount(team.name)).toBe(
      `${team.users?.length ?? 0} members`,
    );
  }
}

async function expectAvatars(pageObjects: PageFactory, organization: Organization) {
  await pageObjects.orgFacade.navigateToTeamsTab();

  for (const team of organization.teams ?? []) {
    const avatarUsernames = await pageObjects.orgTeams.getTeamAvatarUsernames(team.name);
    const expectedUsernames = team.users ?? [];

    for (const username of expectedUsernames) {
      expect(avatarUsernames).toContain(username);
    }
    expect(avatarUsernames.length).toBe(expectedUsernames.length);
  }
}

async function addFile(pageObjects: PageFactory, organization: Organization) {
  const username = await pageObjects.navBar.getCurrentUsername();
  const fileName = `${username}-${uniqueSuffix()}`;
  const [repository] = organization.repositories!;

  await pageObjects.orgRepositories.clickRepository(repository.name);
  await pageObjects.repoNavBar.waitForElements();
  await pageObjects.repoCodeTab.waitForElements(organization.name, repository.name);

  await pageObjects.repoCodeTab.clickNewFileButton();
  await pageObjects.createRepoFile.waitForElements(organization.name, repository.name);
  await pageObjects.createRepoFile.fillFileName(fileName);
  await pageObjects.createRepoFile.fillFileContent(username);
  await pageObjects.createRepoFile.clickCommitChangesButton();

  await pageObjects.repoFile.waitForElements(organization.name, repository.name);
  expect(await pageObjects.repoFile.getFileName()).toBe(fileName);
  expect(await pageObjects.repoFile.getFileContent()).toContain(username);

  repository.files ??= [];
  repository.files.push(fileName);

  await pageObjects.repoNavBar.clickOrganizationLink();
  await pageObjects.orgRepositories.waitForElements();
}

async function expectFileCount(pageObjects: PageFactory, organization: Organization) {
  const [repository] = organization.repositories!;

  await pageObjects.orgRepositories.clickRepository(repository.name);
  await pageObjects.repoNavBar.waitForElements();
  await pageObjects.repoCodeTab.waitForElements(organization.name, repository.name);

  expect(await pageObjects.repoCodeTab.getFilesCount()).toBe(repository.files?.length ?? 0);

  await pageObjects.repoNavBar.clickOrganizationLink();
  await pageObjects.orgRepositories.waitForElements();
}

async function changeRepositoryCodeAccess(
  pageObjects: PageFactory,
  organization: Organization,
  teamName: string,
  repoCodeAccess: Team["repoCodeAccess"] & string,
) {
  await pageObjects.orgFacade.navigateToTeamsTab();
  await pageObjects.orgTeams.clickTeamName(teamName);
  await pageObjects.orgSpecificTeam.waitForElements();
  await pageObjects.orgSpecificTeam.clickSettingsButton();
  await pageObjects.orgNewTeam.waitForEditElements();
  await pageObjects.orgNewTeam.selectRepoCodeAccess(repoCodeAccess);
  await pageObjects.orgNewTeam.clickUpdateTeamButton();
  await pageObjects.orgSpecificTeam.waitForElements();

  organization.teams!.find((candidate) => candidate.name === teamName)!.repoCodeAccess =
    repoCodeAccess;
}

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
        teams: [],
        repositories: [],
      };
      const signIn = async (login: () => Promise<void>) => {
        await login();
        expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await pageObjects.navBar.waitForElements()).toBe(true);
      };
      const loginAsOwner = () => signIn(() => sessionManager.loginAsOwner());
      const loginAsUser = (user: SeededUser) =>
        signIn(() => sessionManager.loginAs(user.username, user.password));

      await test.step("Owner creates the organization", async () => {
        await loginAsOwner();
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

      await test.step("Owner creates the teams and adds the members", async () => {
        await pageObjects.navBar.clickViewOrganizationButton();
        expect(await pageObjects.orgRepositories.areOwnerElementsVisible()).toBe(true);
        expect(await pageObjects.orgNavigation.areOwnerElementsVisible()).toBe(true);

        for (const name of ["dev-team", "qa-team"]) {
          await createTeam(pageObjects, organization, {
            name,
            visibility: "private",
            repoCodeAccess: "write",
            createRepositories: true,
            permissions: "general",
          });
        }
        await pageObjects.orgFacade.navigateToTeamsTab();
        for (const team of organization.teams!) {
          expect(await pageObjects.orgTeams.hasTeamContainer(team.name)).toBe(true);
        }
        // +1 for the organization's own default "Owners" team.
        expect(await pageObjects.orgTeams.getTeamContainersCount()).toBe(
          organization.teams!.length + 1,
        );

        await addTeamMember(pageObjects, organization, user1, "dev-team");
        await addTeamMember(pageObjects, organization, user1, "qa-team");
        await addTeamMember(pageObjects, organization, user2, "qa-team");
        await expectMemberCounts(pageObjects, organization);
        await expectAvatars(pageObjects, organization);
      });

      await test.step("Owner creates the repository and assigns it to the teams", async () => {
        const repository: Repository = { name: "monorepo", visibility: true };

        await pageObjects.orgFacade.navigateToRepositoriesTab();
        await pageObjects.orgRepositories.clickNewRepositoryButton();
        await pageObjects.createRepositoryPage.waitForElements();
        await pageObjects.createRepositoryPage.createRepository(
          repository.name,
          repository.visibility!,
        );
        await pageObjects.repoNavBar.waitForElements();
        await pageObjects.repoCodeTab.waitForElements(organization.name, repository.name);
        const title = await pageObjects.repoNavBar.getRepoTitle();
        expect(title).toContain(organization.name);
        expect(title).toContain(repository.name);
        await pageObjects.repoNavBar.clickOrganizationLink();
        await pageObjects.orgRepositories.waitForElements();
        organization.repositories!.push(repository);

        expect(await pageObjects.orgRepositories.getOwnersRepositoriesCount()).toBe("1");
        expect(await pageObjects.orgRepositories.getRepositoryNames()).toContain(repository.name);

        await addFile(pageObjects, organization);
        await expectFileCount(pageObjects, organization);

        await pageObjects.orgFacade.navigateToTeamsTab();
        for (const team of organization.teams!) {
          await pageObjects.orgFacade.navigateToSpecificTeam(team.name);
          await pageObjects.orgSpecificTeam.navigateToRepositoriesTab();
          await pageObjects.orgSpecificTeam.addRepository(repository.name);
          team.repositories = [repository.name];
          await pageObjects.orgFacade.navigateToTeamsTab();
        }

        for (const team of organization.teams!) {
          await pageObjects.orgFacade.navigateToSpecificTeam(team.name);
          await pageObjects.orgSpecificTeam.navigateToRepositoriesTab();
          expect(await pageObjects.orgSpecificTeam.getAssignedRepositoryNames()).toEqual(
            team.repositories,
          );
          await pageObjects.orgFacade.navigateToTeamsTab();
        }
      });

      await test.step("User 1 writes to the repository", async () => {
        await pageObjects.navBar.clickSignOut();
        await loginAsUser(user1);
        await openSeededOrganization(pageObjects);
        await addFile(pageObjects, organization);
        await expectFileCount(pageObjects, organization);
      });

      await test.step("Owner removes user 1 from dev-team, who keeps writing through qa-team", async () => {
        await pageObjects.navBar.clickSignOut();
        await loginAsOwner();
        await openSeededOrganization(pageObjects);
        await removeTeamMember(pageObjects, organization, user1, "dev-team");
        await expectMemberCounts(pageObjects, organization);

        await pageObjects.navBar.clickSignOut();
        await loginAsUser(user1);
        await openSeededOrganization(pageObjects);
        await addFile(pageObjects, organization);
        await expectFileCount(pageObjects, organization);
      });

      await test.step("Owner gives qa-team read access, so user 2 is asked to fork", async () => {
        await pageObjects.navBar.clickSignOut();
        await loginAsOwner();
        await openSeededOrganization(pageObjects);
        await changeRepositoryCodeAccess(pageObjects, organization, "qa-team", "read");

        await pageObjects.navBar.clickSignOut();
        await loginAsUser(user2);
        await openSeededOrganization(pageObjects);
        await pageObjects.orgRepositories.clickRepository(organization.repositories![0].name);
        await pageObjects.repoNavBar.waitForElements();
        await pageObjects.repoCodeTab.waitForElements(
          organization.name,
          organization.repositories![0].name,
        );
        await pageObjects.repoCodeTab.clickNewFileButton();
        expect(await pageObjects.forkPrompt.waitForElements()).toBe(true);
        expect(await pageObjects.forkPrompt.getHeadingText()).toContain("Fork Repository");
      });

      await test.step("Owner removes qa-team code access, so user 1 no longer sees the Code tab", async () => {
        await pageObjects.navBar.clickSignOut();
        await loginAsOwner();
        await openSeededOrganization(pageObjects);
        await changeRepositoryCodeAccess(pageObjects, organization, "qa-team", "none");

        await pageObjects.navBar.clickSignOut();
        await loginAsUser(user1);
        await openSeededOrganization(pageObjects);
        await pageObjects.orgRepositories.clickRepository(organization.repositories![0].name);
        await pageObjects.repoNavBar.waitForElements();
        expect(await pageObjects.repoNavBar.isCodeTabVisible()).toBe(false);
        expect(await pageObjects.repoNavBar.isIssuesTabActiveByDefault()).toBe(true);
      });

      await test.step("Owner removes user 2, who can no longer reach the organization", async () => {
        await pageObjects.navBar.clickSignOut();
        await loginAsOwner();
        await openSeededOrganization(pageObjects);
        await removeTeamMember(pageObjects, organization, user2, "qa-team");
        await expectMemberCounts(pageObjects, organization);

        await pageObjects.navBar.clickSignOut();
        await loginAsUser(user2);
        await pageObjects.navBar.clickOrganizationsDropdown();
        const organizations = await pageObjects.navBar.getDropdownOrganizationsList();
        expect(organizations).not.toContain(organization.name);
        expect(organizations.length).toBe(1);
      });
    },
  );
});
