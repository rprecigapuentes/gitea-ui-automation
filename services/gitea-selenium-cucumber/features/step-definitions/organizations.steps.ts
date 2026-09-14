import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { expect } from "vitest";
import type { GiteaWorld } from "../support/world";
import { Organization } from "@gitea-automation/business-logic-selenium/api/entities/organization.entity";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import { Team } from "@gitea-automation/business-logic-selenium/api/entities/team.entity";
import { Repository } from "@gitea-automation/business-logic-selenium/api/entities/repository.entity";
import { OrganizationClient } from "@gitea-automation/business-logic-selenium/api/clients/organizations.client";
import { resolveOwnerCredentials, resolveOwnerToken } from "../support/credentials";
import { getSeededUser } from "../support/seeded-users";

When(
  'I navigate to the "Create Organization" page by "organization dropdown" menu',
  async function (this: GiteaWorld) {
    await this.pages.navBar.clickOrganizationsDropdown();
    await this.pages.navBar.clickNewOrganizationDropdownOption();
    await this.pages.createOrganizationPage.waitForElements();
  },
);

When("I create a new organization using:", async function (this: GiteaWorld, dataTable: DataTable) {
  const row = dataTable.rowsHash();
  const organization: Organization = {
    name: `${row.name}-${process.env.BROWSER ?? "local"}-${uniqueSuffix()}`,
    visibility: row.visibility as Organization["visibility"],
    permissions: row.permissions,
  };

  await this.pages.createOrganizationPage.createOrganization(
    organization.name,
    organization.visibility,
    organization.permissions === "true",
  );
  this.scenarioState.organization = organization;
  await this.pages.organizationDashboardPage.waitForElements(this.scenarioState.organization);
  await this.pages.navBar.waitForElements();
  expect(await this.pages.navBar.areOrgDashboardElementsVisible()).toBe(true);
});

Then("I should see the organization created successfully", async function (this: GiteaWorld) {
  await this.pages.navBar.clickOrganizationsDropdown();
  const actualOrganizations = await this.pages.navBar.getDropdownOrganizationsList();
  expect(actualOrganizations).toContain(this.scenarioState.organization!.name);
  const currentOrganizationDashboard = await this.pages.navBar.getCurrentOrganization();
  expect(currentOrganizationDashboard).toBe(this.scenarioState.organization!.name);
});

Given("an organization already exists", async function (this: GiteaWorld) {
  const organizationClient = new OrganizationClient(
    process.env.GITEA_BASE_URL!,
    resolveOwnerToken(),
  );
  const organization: Organization = {
    name: `test-org-${process.env.BROWSER ?? "local"}-${uniqueSuffix()}`,
    visibility: "public",
  };

  await organizationClient.createOrganization(organization.name, organization.visibility);
  this.scenarioState.organization = organization;
  await this.pages.orgFacade.open();
  await this.pages.orgFacade.waitForElements();
});

Given("the seeded organization is open", async function (this: GiteaWorld) {
  await this.pages.orgFacade.open();
  await this.pages.orgFacade.waitForElements();
});

When("I navigate to the organization page", async function (this: GiteaWorld) {
  await this.pages.navBar.clickViewOrganizationButton();
  expect(await this.pages.orgRepositories.areOwnerElementsVisible()).toBe(true);
  expect(await this.pages.orgNavigation.areOwnerElementsVisible()).toBe(true);
});

When("I create the following teams:", async function (this: GiteaWorld, dataTable: DataTable) {
  this.scenarioState.organization!.teams ??= [];

  for (const row of dataTable.hashes()) {
    const team: Team = {
      name: row.name,
      visibility: row.visibility as Team["visibility"],
      repoCodeAccess: row.repoCodeAccess as Team["repoCodeAccess"],
      createRepositories: row.createRepo === "true",
      permissions: "general",
    };

    await this.pages.orgFacade.navigateToTeamsTab();
    await this.pages.orgTeams.clickNewTeamButton();
    await this.pages.orgNewTeam.waitForElements();
    await this.pages.orgNewTeam.createTeam(
      team.name,
      team.visibility,
      team.repoCodeAccess ?? "none",
      team.createRepositories,
    );
    await this.pages.orgSpecificTeam.waitForElements();
    await this.pages.orgNavigation.waitForElements();

    this.scenarioState.organization!.teams.push(team);
  }
});

Then("the created team's page is displayed", async function (this: GiteaWorld) {
  expect(await this.pages.orgSpecificTeam.waitForElements()).toBe(true);
});

Then("the created teams are displayed in Teams page", async function (this: GiteaWorld) {
  await this.pages.orgFacade.navigateToTeamsTab();
  const teamNames = await this.pages.orgTeams.getTeamNames();
  const createdTeams = this.scenarioState.organization!.teams ?? [];

  for (const team of createdTeams) {
    expect(teamNames).toContain(team.name);
  }
  // +1 for the organization's own default "Owners" team.
  expect(teamNames.length).toBe(createdTeams.length + 1);
});

When("I add the following team members:", async function (this: GiteaWorld, dataTable: DataTable) {
  for (const row of dataTable.hashes()) {
    const user = getSeededUser(Number(row.user));

    await this.pages.orgFacade.navigateToSpecificTeam(row.team);
    await this.pages.orgSpecificTeam.addMemberByUsername(user.username);
    expect(await this.pages.orgSpecificTeam.hasMember(user.username)).toBe(true);

    const team = this.scenarioState.organization!.teams!.find(
      (candidate) => candidate.name === row.team,
    );
    team!.users ??= [];
    team!.users.push(user.username);

    await this.pages.orgFacade.navigateToTeamsTab();
  }
});

Then("the member count for each created team is correct", async function (this: GiteaWorld) {
  await this.pages.orgFacade.navigateToTeamsTab();

  for (const team of this.scenarioState.organization!.teams ?? []) {
    const expectedCount = `${team.users?.length ?? 0} members`;
    expect(await this.pages.orgTeams.getTeamMembersCount(team.name)).toBe(expectedCount);
  }
});

Then("the avatars for each created team are correct", async function (this: GiteaWorld) {
  await this.pages.orgFacade.navigateToTeamsTab();

  for (const team of this.scenarioState.organization!.teams ?? []) {
    const avatarUsernames = await this.pages.orgTeams.getTeamAvatarUsernames(team.name);
    const expectedUsernames = team.users ?? [];

    for (const username of expectedUsernames) {
      expect(avatarUsernames).toContain(username);
    }
    expect(avatarUsernames.length).toBe(expectedUsernames.length);
  }
});

When("I navigate to the repositories tab", async function (this: GiteaWorld) {
  await this.pages.orgFacade.navigateToRepositoriesTab();
});

When(
  "I create the following repositories:",
  async function (this: GiteaWorld, dataTable: DataTable) {
    const organizationName = this.scenarioState.organization!.name;
    this.scenarioState.organization!.repositories ??= [];

    for (const row of dataTable.hashes()) {
      const repository: Repository = {
        name: row.name,
        visibility: row.visibility === "true",
      };

      await this.pages.orgRepositories.clickNewRepositoryButton();
      await this.pages.createRepositoryPage.waitForElements();
      await this.pages.createRepositoryPage.createRepository(
        repository.name,
        repository.visibility!,
      );

      await this.pages.repoNavBar.waitForElements();
      await this.pages.repoCodeTab.waitForElements(organizationName, repository.name);

      const title = await this.pages.repoNavBar.getRepoTitle();
      expect(title).toContain(organizationName);
      expect(title).toContain(repository.name);

      await this.pages.repoNavBar.clickOrganizationLink();
      await this.pages.orgRepositories.waitForElements();

      this.scenarioState.organization!.repositories.push(repository);
    }
  },
);

Then("the repositories were created successfully", async function (this: GiteaWorld) {
  const repositories = this.scenarioState.organization!.repositories ?? [];
  expect(await this.pages.orgRepositories.getOwnersRepositoriesCount()).toBe(
    String(repositories.length),
  );

  const repositoryNames = await this.pages.orgRepositories.getRepositoryNames();
  for (const repository of repositories) {
    expect(repositoryNames).toContain(repository.name);
  }
});

When(
  "I add a file to each repository",
  // The commit's loader redirect can outlast Cucumber's default step timeout under load.
  { timeout: 40000 },
  async function (this: GiteaWorld) {
    const organizationName = this.scenarioState.organization!.name;
    const { username } = resolveOwnerCredentials();

    for (const repository of this.scenarioState.organization!.repositories ?? []) {
      await this.pages.orgRepositories.clickRepository(repository.name);
      await this.pages.repoNavBar.waitForElements();
      await this.pages.repoCodeTab.waitForElements(organizationName, repository.name);

      await this.pages.repoCodeTab.clickNewFileButton();
      await this.pages.createRepoFile.waitForElements(organizationName, repository.name);
      await this.pages.createRepoFile.fillFileName(username);
      await this.pages.createRepoFile.fillFileContent(username);
      await this.pages.createRepoFile.clickCommitChangesButton();

      await this.pages.repoFile.waitForElements(organizationName, repository.name);
      expect(await this.pages.repoFile.getFileName()).toBe(username);
      expect(await this.pages.repoFile.getFileContent()).toContain(username);

      await this.pages.repoNavBar.clickOrganizationLink();
      await this.pages.orgRepositories.waitForElements();
    }
  },
);

Then("the file count for each repository is correct", async function (this: GiteaWorld) {
  const organizationName = this.scenarioState.organization!.name;

  for (const repository of this.scenarioState.organization!.repositories ?? []) {
    await this.pages.orgRepositories.clickRepository(repository.name);
    await this.pages.repoNavBar.waitForElements();
    await this.pages.repoCodeTab.waitForElements(organizationName, repository.name);

    expect(await this.pages.repoCodeTab.getFilesCount()).toBe(1);

    await this.pages.repoNavBar.clickOrganizationLink();
    await this.pages.orgRepositories.waitForElements();
  }
});

When(
  "I add the following repositories to each team:",
  async function (this: GiteaWorld, dataTable: DataTable) {
    await this.pages.orgFacade.navigateToTeamsTab();

    for (const row of dataTable.hashes()) {
      await this.pages.orgFacade.navigateToSpecificTeam(row.team);
      await this.pages.orgSpecificTeam.navigateToRepositoriesTab();
      await this.pages.orgSpecificTeam.addRepository(row.repository);

      const team = this.scenarioState.organization!.teams!.find(
        (candidate) => candidate.name === row.team,
      );
      team!.repositories ??= [];
      team!.repositories.push(row.repository);

      await this.pages.orgFacade.navigateToTeamsTab();
    }
  },
);

Then("the repositories assigned to each team are correct", async function (this: GiteaWorld) {
  await this.pages.orgFacade.navigateToTeamsTab();

  for (const team of this.scenarioState.organization!.teams ?? []) {
    await this.pages.orgFacade.navigateToSpecificTeam(team.name);
    await this.pages.orgSpecificTeam.navigateToRepositoriesTab();

    const assignedNames = await this.pages.orgSpecificTeam.getAssignedRepositoryNames();
    const expectedRepositories = team.repositories ?? [];

    for (const repository of expectedRepositories) {
      expect(assignedNames).toContain(repository);
    }
    expect(assignedNames.length).toBe(expectedRepositories.length);

    await this.pages.orgFacade.navigateToTeamsTab();
  }
});

When(
  "I remove the following team members:",
  // The remove-modal fetch can outlast Cucumber's default step timeout under load.
  { timeout: 25000 },
  async function (this: GiteaWorld, dataTable: DataTable) {
    for (const row of dataTable.hashes()) {
      const user = getSeededUser(Number(row.user));

      await this.pages.orgTeams.clickTeamName(row.team);
      await this.pages.orgSpecificTeam.waitForElements();
      expect(await this.pages.orgSpecificTeam.hasRemoveTeamMemberButton(user.username)).toBe(true);
      await this.pages.orgSpecificTeam.clickRemoveTeamMemberButton(user.username);
      expect(await this.pages.orgSpecificTeam.isRemoveTeamMemberModalDisplayed()).toBe(true);
      await this.pages.orgSpecificTeam.confirmRemoveTeamMember();
      expect(await this.pages.orgSpecificTeam.isRemoveTeamMemberModalHidden()).toBe(true);

      const team = this.scenarioState.organization!.teams!.find(
        (candidate) => candidate.name === row.team,
      );
      team!.users = team!.users?.filter((username) => username !== user.username) ?? [];

      await this.pages.orgFacade.navigateToTeamsTab();
    }
  },
);
