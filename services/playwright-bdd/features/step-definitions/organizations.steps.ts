// spec: services/playwright-bdd/features/scenarios/organizations.feature
// seed: services/playwright-bdd/tests/seeds/seed.spec.ts

import type { DataTable } from "playwright-bdd";
import { expect, Given, When, Then } from "../../fixtures/fixture";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";
import type { Team } from "@gitea-automation/business-logic/entities/team.entity";
import type { Repository } from "@gitea-automation/business-logic/entities/repository.entity";

Given('I login with valid credentials as "owner"', async ({ sessionManager, pageObjects }) => {
  await sessionManager.loginAsOwner();
  expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
  expect(await pageObjects.navBar.waitForElements()).toBe(true);
});

Given(
  "I login with valid credentials as user {int}",
  async ({ sessionManager, pageObjects, seededUsers }, userIndex: number) => {
    const user = seededUsers[userIndex - 1];

    await sessionManager.loginAs(user.username, user.password);
    expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
    expect(await pageObjects.navBar.waitForElements()).toBe(true);
  },
);

When("I logout", async ({ sessionManager }) => {
  await sessionManager.logout();
});

Given("the seeded organization is open", async ({ pageObjects }) => {
  await pageObjects.orgFacade.open();
  await pageObjects.orgFacade.waitForElements();
});

When(
  'I navigate to the "Create Organization" page by "organization dropdown" menu',
  async ({ pageObjects }) => {
    await pageObjects.navBar.clickOrganizationsDropdown();
    await pageObjects.navBar.clickNewOrganizationDropdownOption();
    await pageObjects.createOrganizationPage.waitForElements();
  },
);

When(
  "I create a new organization using:",
  async ({ pageObjects, scenarioState, $testInfo }, table: DataTable) => {
    const row = table.rowsHash();
    const organization: Organization = {
      name: `${row.name}-${$testInfo.project.name}-${uniqueSuffix()}`,
      visibility: row.visibility as Organization["visibility"],
      permissions: row.permissions,
    };

    await pageObjects.createOrganizationPage.createOrganization(
      organization.name,
      organization.visibility,
      organization.permissions === "true",
    );
    scenarioState.organization = organization;
    await pageObjects.organizationDashboardPage.waitForElements(organization);
    expect(await pageObjects.navBar.waitForElements()).toBe(true);
    expect(await pageObjects.navBar.areOrgDashboardElementsVisible()).toBe(true);
  },
);

Then(
  "I should see the organization created successfully",
  async ({ pageObjects, scenarioState }) => {
    await pageObjects.navBar.clickOrganizationsDropdown();
    expect(await pageObjects.navBar.getDropdownOrganizationsList()).toContain(
      scenarioState.organization!.name,
    );
    expect(await pageObjects.navBar.getCurrentOrganization()).toBe(
      scenarioState.organization!.name,
    );
  },
);

When("I navigate to the organization page", async ({ pageObjects }) => {
  await pageObjects.navBar.clickViewOrganizationButton();
  expect(await pageObjects.orgRepositories.areOwnerElementsVisible()).toBe(true);
  expect(await pageObjects.orgNavigation.areOwnerElementsVisible()).toBe(true);
});

When("I create the following teams:", async ({ pageObjects, scenarioState }, table: DataTable) => {
  scenarioState.organization!.teams ??= [];

  for (const row of table.hashes()) {
    const team: Team = {
      name: row.name,
      visibility: row.visibility as Team["visibility"],
      repoCodeAccess: row.repoCodeAccess as Team["repoCodeAccess"],
      createRepositories: row.createRepo === "true",
      permissions: "general",
    };

    await pageObjects.orgFacade.navigateToTeamsTab();
    await pageObjects.orgTeams.clickNewTeamButton();
    await pageObjects.orgNewTeam.waitForElements();
    await pageObjects.orgNewTeam.createTeam(
      team.name,
      team.visibility,
      team.repoCodeAccess ?? "none",
      team.createRepositories,
    );
    await pageObjects.orgSpecificTeam.waitForElements();
    await pageObjects.orgNavigation.waitForElements();

    scenarioState.organization!.teams.push(team);
  }
});

Then("the created team's page is displayed", async ({ pageObjects }) => {
  expect(await pageObjects.orgSpecificTeam.waitForElements()).toBe(true);
});

Then("the created teams are displayed in Teams page", async ({ pageObjects, scenarioState }) => {
  await pageObjects.orgFacade.navigateToTeamsTab();
  const createdTeams = scenarioState.organization!.teams ?? [];

  for (const team of createdTeams) {
    expect(await pageObjects.orgTeams.hasTeamContainer(team.name)).toBe(true);
  }
  expect(await pageObjects.orgTeams.getTeamContainersCount()).toBe(createdTeams.length + 1);
});

When(
  "I add the following team members:",
  async ({ pageObjects, scenarioState, seededUsers }, table: DataTable) => {
    for (const row of table.hashes()) {
      const user = seededUsers[Number(row.user) - 1];

      await pageObjects.orgFacade.navigateToSpecificTeam(row.team);
      await pageObjects.orgSpecificTeam.addMemberByUsername(user.username);
      expect(await pageObjects.orgSpecificTeam.hasMember(user.username)).toBe(true);

      const team = scenarioState.organization!.teams!.find(
        (candidate) => candidate.name === row.team,
      );
      team!.users ??= [];
      team!.users.push(user.username);

      await pageObjects.orgFacade.navigateToTeamsTab();
    }
  },
);

Then(
  "the member count for each created team is correct",
  async ({ pageObjects, scenarioState }) => {
    await pageObjects.orgFacade.navigateToTeamsTab();

    for (const team of scenarioState.organization!.teams ?? []) {
      expect(await pageObjects.orgTeams.getTeamMembersCount(team.name)).toBe(
        `${team.users?.length ?? 0} members`,
      );
    }
  },
);

Then("the avatars for each created team are correct", async ({ pageObjects, scenarioState }) => {
  await pageObjects.orgFacade.navigateToTeamsTab();

  for (const team of scenarioState.organization!.teams ?? []) {
    const avatarUsernames = await pageObjects.orgTeams.getTeamAvatarUsernames(team.name);
    const expectedUsernames = team.users ?? [];

    for (const username of expectedUsernames) {
      expect(avatarUsernames).toContain(username);
    }
    expect(avatarUsernames.length).toBe(expectedUsernames.length);
  }
});

When("I navigate to the repositories tab", async ({ pageObjects }) => {
  await pageObjects.orgFacade.navigateToRepositoriesTab();
});

When(
  "I create the following repositories:",
  async ({ pageObjects, scenarioState }, table: DataTable) => {
    const organizationName = scenarioState.organization!.name;
    scenarioState.organization!.repositories ??= [];

    for (const row of table.hashes()) {
      const repository: Repository = {
        name: row.name,
        visibility: row.visibility === "true",
      };

      await pageObjects.orgRepositories.clickNewRepositoryButton();
      await pageObjects.createRepositoryPage.waitForElements();
      await pageObjects.createRepositoryPage.createRepository(
        repository.name,
        repository.visibility!,
      );

      await pageObjects.repoNavBar.waitForElements();
      await pageObjects.repoCodeTab.waitForElements(organizationName, repository.name);

      const title = await pageObjects.repoNavBar.getRepoTitle();
      expect(title).toContain(organizationName);
      expect(title).toContain(repository.name);

      await pageObjects.repoNavBar.clickOrganizationLink();
      await pageObjects.orgRepositories.waitForElements();

      scenarioState.organization!.repositories.push(repository);
    }
  },
);

Then("the repositories were created successfully", async ({ pageObjects, scenarioState }) => {
  const repositories = scenarioState.organization!.repositories ?? [];

  expect(await pageObjects.orgRepositories.getOwnersRepositoriesCount()).toBe(
    String(repositories.length),
  );

  const repositoryNames = await pageObjects.orgRepositories.getRepositoryNames();
  for (const repository of repositories) {
    expect(repositoryNames).toContain(repository.name);
  }
});

When("I add a file to each repository", async ({ pageObjects, scenarioState }) => {
  const organizationName = scenarioState.organization!.name;
  const username = await pageObjects.navBar.getCurrentUsername();
  const fileName = `${username}-${uniqueSuffix()}`;
  const [repository] = scenarioState.organization!.repositories!;

  await pageObjects.orgRepositories.clickRepository(repository.name);
  await pageObjects.repoNavBar.waitForElements();
  await pageObjects.repoCodeTab.waitForElements(organizationName, repository.name);

  await pageObjects.repoCodeTab.clickNewFileButton();
  await pageObjects.createRepoFile.waitForElements(organizationName, repository.name);
  await pageObjects.createRepoFile.fillFileName(fileName);
  await pageObjects.createRepoFile.fillFileContent(username);
  await pageObjects.createRepoFile.clickCommitChangesButton();

  await pageObjects.repoFile.waitForElements(organizationName, repository.name);
  expect(await pageObjects.repoFile.getFileName()).toBe(fileName);
  expect(await pageObjects.repoFile.getFileContent()).toContain(username);

  repository.files ??= [];
  repository.files.push(fileName);

  await pageObjects.repoNavBar.clickOrganizationLink();
  await pageObjects.orgRepositories.waitForElements();
});

Then("the file count for each repository is correct", async ({ pageObjects, scenarioState }) => {
  const organizationName = scenarioState.organization!.name;
  const [repository] = scenarioState.organization!.repositories!;

  await pageObjects.orgRepositories.clickRepository(repository.name);
  await pageObjects.repoNavBar.waitForElements();
  await pageObjects.repoCodeTab.waitForElements(organizationName, repository.name);

  expect(await pageObjects.repoCodeTab.getFilesCount()).toBe(repository.files?.length ?? 0);

  await pageObjects.repoNavBar.clickOrganizationLink();
  await pageObjects.orgRepositories.waitForElements();
});

When(
  "I add the following repositories to each team:",
  async ({ pageObjects, scenarioState }, table: DataTable) => {
    await pageObjects.orgFacade.navigateToTeamsTab();

    for (const row of table.hashes()) {
      await pageObjects.orgFacade.navigateToSpecificTeam(row.team);
      await pageObjects.orgSpecificTeam.navigateToRepositoriesTab();
      await pageObjects.orgSpecificTeam.addRepository(row.repository);

      const team = scenarioState.organization!.teams!.find(
        (candidate) => candidate.name === row.team,
      );
      team!.repositories ??= [];
      team!.repositories.push(row.repository);

      await pageObjects.orgFacade.navigateToTeamsTab();
    }
  },
);

Then(
  "the repositories assigned to each team are correct",
  async ({ pageObjects, scenarioState }) => {
    await pageObjects.orgFacade.navigateToTeamsTab();

    for (const team of scenarioState.organization!.teams ?? []) {
      await pageObjects.orgFacade.navigateToSpecificTeam(team.name);
      await pageObjects.orgSpecificTeam.navigateToRepositoriesTab();

      const assignedNames = await pageObjects.orgSpecificTeam.getAssignedRepositoryNames();
      const expectedRepositories = team.repositories ?? [];

      for (const repository of expectedRepositories) {
        expect(assignedNames).toContain(repository);
      }
      expect(assignedNames.length).toBe(expectedRepositories.length);

      await pageObjects.orgFacade.navigateToTeamsTab();
    }
  },
);

When(
  "I remove the following team members:",
  async ({ pageObjects, scenarioState, seededUsers }, table: DataTable) => {
    await pageObjects.orgFacade.navigateToTeamsTab();

    for (const row of table.hashes()) {
      const user = seededUsers[Number(row.user) - 1];

      await pageObjects.orgTeams.clickTeamName(row.team);
      await pageObjects.orgSpecificTeam.waitForElements();
      expect(await pageObjects.orgSpecificTeam.hasRemoveTeamMemberButton(user.username)).toBe(true);
      await pageObjects.orgSpecificTeam.clickRemoveTeamMemberButton(user.username);
      expect(await pageObjects.orgSpecificTeam.isRemoveTeamMemberModalDisplayed()).toBe(true);
      await pageObjects.orgSpecificTeam.confirmRemoveTeamMember();
      expect(await pageObjects.orgSpecificTeam.isRemoveTeamMemberModalHidden()).toBe(true);

      const team = scenarioState.organization!.teams!.find(
        (candidate) => candidate.name === row.team,
      );
      team!.users = team!.users?.filter((username) => username !== user.username) ?? [];

      await pageObjects.orgFacade.navigateToTeamsTab();
    }
  },
);

When(
  "I change the repository code access for {string} to {string}",
  async ({ pageObjects, scenarioState }, teamName: string, repoCodeAccess: string) => {
    await pageObjects.orgFacade.navigateToTeamsTab();
    await pageObjects.orgTeams.clickTeamName(teamName);
    await pageObjects.orgSpecificTeam.waitForElements();
    await pageObjects.orgSpecificTeam.clickSettingsButton();
    await pageObjects.orgNewTeam.waitForEditElements();
    await pageObjects.orgNewTeam.selectRepoCodeAccess(repoCodeAccess as "none" | "read" | "write");
    await pageObjects.orgNewTeam.clickUpdateTeamButton();
    await pageObjects.orgSpecificTeam.waitForElements();

    const team = scenarioState.organization!.teams!.find(
      (candidate) => candidate.name === teamName,
    );
    team!.repoCodeAccess = repoCodeAccess as Team["repoCodeAccess"];
  },
);

When("I open the repository", async ({ pageObjects, scenarioState }) => {
  const organizationName = scenarioState.organization!.name;
  const [repository] = scenarioState.organization!.repositories!;

  await pageObjects.orgRepositories.clickRepository(repository.name);
  await pageObjects.repoNavBar.waitForElements();
  await pageObjects.repoCodeTab.waitForElements(organizationName, repository.name);
});

When("I click the New File button", async ({ pageObjects }) => {
  await pageObjects.repoCodeTab.clickNewFileButton();
});

Then("the fork repository prompt is displayed", async ({ pageObjects }) => {
  expect(await pageObjects.forkPrompt.waitForElements()).toBe(true);
  expect(await pageObjects.forkPrompt.getHeadingText()).toContain("Fork Repository");
});

When("I view the repository", async ({ pageObjects, scenarioState }) => {
  const [repository] = scenarioState.organization!.repositories!;

  await pageObjects.orgRepositories.clickRepository(repository.name);
  await pageObjects.repoNavBar.waitForElements();
});

Then("the Code tab is not visible", async ({ pageObjects }) => {
  expect(await pageObjects.repoNavBar.isCodeTabVisible()).toBe(false);
});

Then("the Issues tab is displayed by default", async ({ pageObjects }) => {
  expect(await pageObjects.repoNavBar.isIssuesTabActiveByDefault()).toBe(true);
});

Then("the organization is no longer accessible", async ({ pageObjects, scenarioState }) => {
  await pageObjects.navBar.clickOrganizationsDropdown();
  const organizations = await pageObjects.navBar.getDropdownOrganizationsList();

  expect(organizations).not.toContain(scenarioState.organization!.name);
  expect(organizations.length).toBe(1);
});
