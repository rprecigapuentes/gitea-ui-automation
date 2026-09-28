// spec: services/playwright-bdd/features/scenarios/create-organization.feature
// seed: services/playwright-bdd/tests/seeds/seed.spec.ts

import type { DataTable } from "playwright-bdd";
import { expect, Given, When, Then } from "../../fixtures/fixture";
import { ORGANIZATION_NAME_PREFIX } from "@gitea-automation/core-playwright/fixtures/base.fixtures";
import { resolveInvitedCredentials } from "@gitea-automation/core-playwright/fixtures/credentials";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import { OrgTab } from "@gitea-automation/business-logic/pages/organizations/fragments/org-navigation.fragment";
import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";
import type { Team } from "@gitea-automation/business-logic/entities/team.entity";

const INVITED_SEARCH_LENGTH = 2;

Given("I am signed in as the owner", async ({ sessionManager }) => {
  await sessionManager.loginAsOwner();
});

When("I open the main page", async ({ pageObjects }) => {
  await pageObjects.mainPage.open();
});

Then(
  "the main page shows the owner as the current account",
  async ({ pageObjects, ownerCredentials }) => {
    expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
    expect(await pageObjects.navBar.isVisibleOnMainPage(ownerCredentials.username)).toBe(true);
    expect(await pageObjects.navBar.getCurrentOrganization()).toBe(ownerCredentials.username);
  },
);

When("I open the create organization form from the organizations menu", async ({ pageObjects }) => {
  await pageObjects.navBar.clickOrganizationsDropdown();
  await pageObjects.navBar.clickNewOrganizationDropdownOption();
});

Then("the create organization form has its default state", async ({ pageObjects }) => {
  expect(await pageObjects.createOrganizationPage.hasExpectedFormElements()).toBe(true);
  expect(await pageObjects.createOrganizationPage.hasDefaultFormState()).toBe(true);
});

When("I create a private organization", async ({ pageObjects, scenarioState, $testInfo }) => {
  const organization: Organization = {
    name: `${ORGANIZATION_NAME_PREFIX}-${Date.now()}-${$testInfo.project.name}-${uniqueSuffix()}`,
    visibility: "private",
    permissions: "true",
  };

  await pageObjects.createOrganizationPage.enterOrganizationName(organization.name);
  await pageObjects.createOrganizationPage.selectVisibility(organization.visibility);
  await pageObjects.createOrganizationPage.clickCreateOrganizationButton();

  scenarioState.organization = organization;
});

Then(
  "the dashboard of the created organization is shown",
  async ({ pageObjects, scenarioState }) => {
    if (!scenarioState.organization) {
      throw new Error("the scenario has not created the organization yet");
    }

    expect(await pageObjects.navBar.waitForElements()).toBe(true);
    expect(await pageObjects.navBar.areOrgDashboardElementsVisible()).toBe(true);
    expect(await pageObjects.navBar.getViewOrganizationButtonText()).toContain(
      scenarioState.organization.name,
    );
  },
);

When("I open the created organization", async ({ pageObjects }) => {
  await pageObjects.navBar.clickViewOrganizationButton();
});

Then(
  "the organization has the owner as its only member and no repositories",
  async ({ pageObjects, scenarioState, ownerCredentials }) => {
    if (!scenarioState.organization) {
      throw new Error("the scenario has not created the organization yet");
    }

    expect(await pageObjects.orgNavigation.areOwnerElementsVisible()).toBe(true);
    expect(
      await pageObjects.orgNavigation.hasOrganizationNameDisplayed(scenarioState.organization.name),
    ).toBe(true);
    expect(await pageObjects.orgNavigation.isTabSelected(OrgTab.Repos)).toBe(true);
    expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Members)).toBe("1");
    expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Teams)).toBe("1");
    expect(await pageObjects.orgRepositories.areOwnerElementsVisible()).toBe(true);
    expect(await pageObjects.orgRepositories.getMembersCount()).toBe("1");
    expect(await pageObjects.orgRepositories.getMemberAvatarsCount()).toBe(1);
    expect(await pageObjects.orgRepositories.hasMemberAvatar(ownerCredentials.username)).toBe(true);
    expect(await pageObjects.orgRepositories.getOwnersMembersCount()).toBe("1");
    expect(await pageObjects.orgRepositories.getOwnersRepositoriesCount()).toBe("0");
    expect(await pageObjects.orgRepositories.hasNewTeamButton()).toBe(true);
  },
);

Then("the browser is on the created organization", async ({ pageObjects }) => {
  expect(pageObjects.orgFacade.getUrl()).toBe(await pageObjects.orgFacade.getCurrentUrl());
});

When("I open the Teams tab of the organization", async ({ pageObjects }) => {
  await pageObjects.orgFacade.navigateToTeamsTab();
});

When("I return to the Teams tab", async ({ pageObjects }) => {
  await pageObjects.orgFacade.navigateToTeamsTab();
});

Then("the Teams tab is selected", async ({ pageObjects }) => {
  expect(await pageObjects.orgNavigation.isTabSelected(OrgTab.Teams)).toBe(true);
});

Then("the Teams tab counts {int}", async ({ pageObjects }, count: number) => {
  expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Teams)).toBe(String(count));
});

Then("the Members tab counts {int}", async ({ pageObjects }, count: number) => {
  expect(await pageObjects.orgNavigation.getTabCount(OrgTab.Members)).toBe(String(count));
});

Then("the Teams tab lists these teams:", async ({ pageObjects }, teams: DataTable) => {
  const rows = teams.hashes();

  expect(await pageObjects.orgTeams.areOwnerElementsVisible()).toBe(true);
  expect(await pageObjects.orgTeams.getTeamContainersCount()).toBe(rows.length);

  for (const row of rows) {
    expect(await pageObjects.orgTeams.hasTeamContainer(row.team)).toBe(true);
    expect(await pageObjects.orgTeams.getTeamMembersCount(row.team)).toBe(`${row.members} members`);
  }
});

Then(
  "the owner is the only member of the team {string}",
  async ({ pageObjects, ownerCredentials }, team: string) => {
    expect(await pageObjects.orgTeams.getTeamAvatarsCount(team)).toBe(1);
    expect(await pageObjects.orgTeams.hasTeamAvatar(team, ownerCredentials.username)).toBe(true);
  },
);

When("I open the new team form", async ({ pageObjects }) => {
  await pageObjects.orgFacade.navigateToNewTeam();
});

Then("the new team form has its default state", async ({ pageObjects }) => {
  expect(await pageObjects.orgNewTeam.waitForElements()).toBe(true);
  expect(await pageObjects.orgNewTeam.hasDefaultFormState()).toBe(true);
});

When(
  "I create the private team {string} that can create repositories",
  async ({ pageObjects }, name: string) => {
    const team: Team = {
      name,
      visibility: "private",
      createRepositories: true,
      permissions: "general",
    };

    await pageObjects.orgNewTeam.enterTeamName(team.name);
    await pageObjects.orgNewTeam.selectVisibility(team.visibility);
    await pageObjects.orgNewTeam.enableCreateRepositories();
    await pageObjects.orgFacade.createTeam(team.name);
  },
);

Then(
  "the page of the team {string} shows a private team without members or repositories",
  async ({ pageObjects }, team: string) => {
    expect(await pageObjects.orgSpecificTeam.isVisibleForOwner()).toBe(true);
    expect(await pageObjects.orgSpecificTeam.hasTeamNameDisplayed(team)).toBe(true);
    expect(await pageObjects.orgSpecificTeam.hasPrivateVisibility()).toBe(true);
    expect(await pageObjects.orgSpecificTeam.getMembersCount()).toBe("0");
    expect(await pageObjects.orgSpecificTeam.getRepositoriesCount()).toBe("0");
    expect(await pageObjects.orgSpecificTeam.hasEmptyMembersMessage()).toBe(true);
  },
);

Then("the team {string} offers to add a member", async ({ pageObjects }, team: string) => {
  expect(await pageObjects.orgTeams.hasAddTeamMemberLink(team)).toBe(true);
});

When("I open the team {string}", async ({ pageObjects }, team: string) => {
  await pageObjects.orgFacade.navigateToSpecificTeam(team);
});

When(
  "I search for users by the first 2 characters of the invited user's name",
  async ({ pageObjects, $testInfo }) => {
    const invited = resolveInvitedCredentials($testInfo.project.name);

    await pageObjects.orgSpecificTeam.searchUsers(invited.username.slice(0, INVITED_SEARCH_LENGTH));
  },
);

Then(
  "the search lists only matching users, including the invited user",
  async ({ pageObjects, $testInfo }) => {
    const invited = resolveInvitedCredentials($testInfo.project.name);
    const query = invited.username.slice(0, INVITED_SEARCH_LENGTH);

    expect(await pageObjects.orgSpecificTeam.hasUserSearchResults()).toBe(true);
    expect(await pageObjects.orgSpecificTeam.hasOnlyMatchingUserSearchResults(query)).toBe(true);
    expect(await pageObjects.orgSpecificTeam.hasUserSearchResult(invited.username)).toBe(true);
  },
);

When("I select the invited user", async ({ pageObjects, $testInfo }) => {
  const invited = resolveInvitedCredentials($testInfo.project.name);

  await pageObjects.orgSpecificTeam.selectUser(invited.username);
});

Then("the invited user is selected", async ({ pageObjects, $testInfo }) => {
  const invited = resolveInvitedCredentials($testInfo.project.name);

  expect(await pageObjects.orgSpecificTeam.hasSelectedUser(invited.username)).toBe(true);
});

When("I add the selected user to the team", async ({ pageObjects }) => {
  await pageObjects.orgSpecificTeam.addSelectedUser();
});

Then(
  "the page of the team {string} lists the invited user as its only member",
  async ({ pageObjects, $testInfo }, team: string) => {
    const invited = resolveInvitedCredentials($testInfo.project.name);

    expect(await pageObjects.orgSpecificTeam.hasTeamNameDisplayed(team)).toBe(true);
    expect(await pageObjects.orgSpecificTeam.getMembersCount()).toBe("1");
    expect(await pageObjects.orgSpecificTeam.hasNoEmptyMembersMessage()).toBe(true);
    expect(await pageObjects.orgSpecificTeam.hasMember(invited.username)).toBe(true);
    expect(await pageObjects.orgSpecificTeam.hasRemoveTeamMemberButton(invited.username)).toBe(
      true,
    );
  },
);

Then(
  "the team {string} shows the invited user's avatar and no longer offers to add a member",
  async ({ pageObjects, $testInfo }, team: string) => {
    const invited = resolveInvitedCredentials($testInfo.project.name);

    expect(await pageObjects.orgTeams.hasTeamAvatar(team, invited.username)).toBe(true);
    expect(await pageObjects.orgTeams.doesNotHaveAddTeamMemberLink(team)).toBe(true);
  },
);

Then(
  "the page of the team {string} offers to remove the invited user",
  async ({ pageObjects, $testInfo }, team: string) => {
    const invited = resolveInvitedCredentials($testInfo.project.name);

    expect(await pageObjects.orgSpecificTeam.hasTeamNameDisplayed(team)).toBe(true);
    expect(await pageObjects.orgSpecificTeam.hasRemoveTeamMemberButton(invited.username)).toBe(
      true,
    );
  },
);

When("I ask to remove the invited user from the team", async ({ pageObjects, $testInfo }) => {
  const invited = resolveInvitedCredentials($testInfo.project.name);

  await pageObjects.orgSpecificTeam.clickRemoveTeamMemberButton(invited.username);
});

Then("the removal confirmation is shown", async ({ pageObjects }) => {
  expect(await pageObjects.orgSpecificTeam.isRemoveTeamMemberModalDisplayed()).toBe(true);
});

When("I confirm the removal", async ({ pageObjects }) => {
  await pageObjects.orgSpecificTeam.confirmRemoveTeamMember();
});

Then("the removal confirmation is closed", async ({ pageObjects }) => {
  expect(await pageObjects.orgSpecificTeam.isRemoveTeamMemberModalHidden()).toBe(true);
});

Then(
  "the page of the team {string} shows a team without members",
  async ({ pageObjects }, team: string) => {
    expect(await pageObjects.orgSpecificTeam.hasTeamNameDisplayed(team)).toBe(true);
    expect(await pageObjects.orgSpecificTeam.getMembersCount()).toBe("0");
    expect(await pageObjects.orgSpecificTeam.hasEmptyMembersMessage()).toBe(true);
  },
);

When("the owner signs out", async ({ sessionManager }) => {
  await sessionManager.logout();
});
