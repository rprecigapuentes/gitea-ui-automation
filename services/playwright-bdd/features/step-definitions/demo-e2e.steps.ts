// spec: services/playwright-bdd/features/scenarios/demo-e2e.feature
// seed: services/playwright-bdd/tests/seeds/demo.spec.ts

import { DataTable } from "playwright-bdd";
import { expect, Given, When, Then } from "../../fixtures/fixture";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";
import type { Team } from "@gitea-automation/business-logic/entities/team.entity";
import type { ScenarioState } from "@gitea-automation/business-logic/state/scenario.entity";

const LABEL_DESCRIPTION = "Set by the demo end to end";
const LABEL_COLOR = "#e11d48";
const ISSUE_DESCRIPTION_TAIL = "The item the demo follows from assignment to close.";

/* The title and description travel through `scenarioState` rather than a variable in this file,
   which parallel workers share. */
function getCreatedIssue(scenarioState: ScenarioState): NonNullable<ScenarioState["createdIssue"]> {
  const createdIssue = scenarioState.createdIssue;

  if (!createdIssue) throw new Error("the scenario has not filled the issue form yet");

  return createdIssue;
}

function getCreatedLabel(scenarioState: ScenarioState): NonNullable<ScenarioState["label"]> {
  const label = scenarioState.label;

  if (!label) throw new Error("the scenario has not created the scoped label yet");

  return label;
}

Given("the seeded organization is open", async ({ pageObjects }) => {
  await pageObjects.orgFacade.open();
  await pageObjects.orgFacade.waitForElements();
});

When(
  "I create the following teams:",
  async ({ pageObjects, scenarioState }, dataTable: DataTable) => {
    scenarioState.organization!.teams ??= [];

    for (const row of dataTable.hashes()) {
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
  },
);

Then("the created teams are displayed in Teams page", async ({ pageObjects, scenarioState }) => {
  await pageObjects.orgFacade.navigateToTeamsTab();
  const createdTeams = scenarioState.organization!.teams ?? [];

  // Asked for one card at a time rather than read off one snapshot of the grid: a snapshot
  // taken while the grid is still rendering can answer for a team that has not appeared yet.
  for (const team of createdTeams) {
    expect(await pageObjects.orgTeams.hasTeamContainer(team.name)).toBe(true);
  }
  // +1 for the organization's own default "Owners" team.
  expect(await pageObjects.orgTeams.getTeamContainersCount()).toBe(createdTeams.length + 1);
});

Then("the team {string} has no members yet", async ({ pageObjects }, team: string) => {
  await pageObjects.orgFacade.navigateToTeamsTab();
  await pageObjects.orgFacade.navigateToSpecificTeam(team);

  expect(await pageObjects.orgSpecificTeam.hasEmptyMembersMessage()).toBe(true);
});

When(
  "I add the first seeded repository to the team {string}",
  async ({ pageObjects, seededOrganizationWithRepositories }, team: string) => {
    const [first] = seededOrganizationWithRepositories.repositories;

    await pageObjects.orgFacade.navigateToTeamsTab();
    await pageObjects.orgFacade.navigateToSpecificTeam(team);
    await pageObjects.orgSpecificTeam.navigateToRepositoriesTab();
    await pageObjects.orgSpecificTeam.addRepository(first.name);
  },
);

When(
  "I open the new issue form of the first seeded repository",
  async ({ pageObjects, seededOrganizationWithRepositories }) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [first] = repositories;

    await pageObjects.createIssuePage.openFor(organizationName, first.name);
  },
);

Then(
  "the assignee list does not offer user {int}",
  async ({ pageObjects, seededUsers }, userIndex: number) => {
    expect(await pageObjects.createIssuePage.offersAssignee(seededUsers[userIndex - 1].id)).toBe(
      false,
    );
  },
);

Given("the teams page of the organization is open", async ({ pageObjects }) => {
  await pageObjects.orgFacade.open();
  await pageObjects.orgFacade.waitForElements();
  await pageObjects.orgFacade.navigateToTeamsTab();
});

When(
  "I add the following team members:",
  async ({ pageObjects, scenarioState, seededUsers }, dataTable: DataTable) => {
    for (const row of dataTable.hashes()) {
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
      const expectedCount = `${team.users?.length ?? 0} members`;
      expect(await pageObjects.orgTeams.getTeamMembersCount(team.name)).toBe(expectedCount);
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

Then(
  "the assignee list offers user {int}",
  async ({ pageObjects, seededUsers }, userIndex: number) => {
    expect(await pageObjects.createIssuePage.offersAssignee(seededUsers[userIndex - 1].id)).toBe(
      true,
    );
  },
);

When(
  "I create the scoped label {string} in the first seeded repository",
  async ({ pageObjects, scenarioState, seededOrganizationWithRepositories }, name: string) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [first] = repositories;

    await pageObjects.labelListPage.openFor(organizationName, first.name);

    const row = await pageObjects.labelListPage.createScopedLabel({
      name,
      description: LABEL_DESCRIPTION,
      color: LABEL_COLOR,
    });

    scenarioState.label = { id: row.id, name: row.name };
  },
);

When(
  "I fill the issue {string} with a description",
  async ({ pageObjects, scenarioState }, heading: string) => {
    const title = testDataName("S2-DEMO-ISS", heading);
    const description = `# ${heading}\n\n${ISSUE_DESCRIPTION_TAIL}`;

    await pageObjects.createIssuePage.fillTitle(title);
    await pageObjects.createIssuePage.fillDescription(description);

    scenarioState.createdIssue = { title, description };
  },
);

Then(
  "the description preview renders the heading {string}",
  async ({ pageObjects }, heading: string) => {
    await pageObjects.createIssuePage.openPreview();

    expect(await pageObjects.createIssuePage.getPreviewHeadings()).toContain(heading);
  },
);

When(
  "I select the label, the milestone and user {int} as assignee",
  async ({ pageObjects, scenarioState, seededMilestone, seededUsers }, userIndex: number) => {
    await pageObjects.createIssuePage.selectLabel(getCreatedLabel(scenarioState).id);
    await pageObjects.createIssuePage.selectMilestone(seededMilestone.id);
    await pageObjects.createIssuePage.selectAssignee(seededUsers[userIndex - 1].id);
  },
);

Then(
  "the created issue carries the label, the milestone and user {int} as assignee",
  async ({ pageObjects, scenarioState, seededMilestone, seededUsers }, userIndex: number) => {
    expect(await pageObjects.issuePage.getAppliedLabelIds()).toEqual([
      getCreatedLabel(scenarioState).id,
    ]);
    expect(await pageObjects.issuePage.getMilestoneName()).toBe(seededMilestone.title);
    expect(await pageObjects.issuePage.getAssigneeNames()).toEqual([
      seededUsers[userIndex - 1].username,
    ]);
  },
);

When(
  "I filter the issue list of the first seeded repository by the label",
  async ({ pageObjects, scenarioState, seededOrganizationWithRepositories }) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [first] = repositories;

    await pageObjects.issueListPage.openFor(organizationName, first.name);
    await pageObjects.issueListPage.filterByLabel(getCreatedLabel(scenarioState).id);
  },
);

Then("the issue list shows only the created issue", async ({ pageObjects, scenarioState }) => {
  expect(await pageObjects.issueListPage.getIssueTitles()).toEqual([
    getCreatedIssue(scenarioState).title,
  ]);
});

Given(
  "the created issue is in the default column",
  async ({ pageObjects, scenarioState, seededOrganizationWithRepositories, kanbanProject }) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [first] = repositories;
    const { number } = getCreatedIssue(scenarioState);

    if (!number) throw new Error("the scenario has not submitted the created issue yet");

    await pageObjects.issuePage.openFor(organizationName, first.name, number);
    await pageObjects.issuePage.assignProject(kanbanProject.id);
  },
);

When(
  "I drag the second seeded issue onto the column {string}",
  async ({ pageObjects, seededOrganizationWithRepositories }, title: string) => {
    const [, second] = seededOrganizationWithRepositories.repositories;

    await pageObjects.projectBoardPage.moveCard(second.issue.id, title);
  },
);

Then(
  "the column {string} holds only the second seeded issue",
  async ({ pageObjects, seededOrganizationWithRepositories }, title: string) => {
    const [, second] = seededOrganizationWithRepositories.repositories;

    expect(await pageObjects.projectBoardPage.getColumnCardIssueIds(title)).toEqual([
      second.issue.id,
    ]);
  },
);

Then(
  "the default column holds the second seeded issue",
  async ({ pageObjects, seededOrganizationWithRepositories }) => {
    const [, second] = seededOrganizationWithRepositories.repositories;

    expect(await pageObjects.projectBoardPage.defaultColumnHoldsIssue(second.issue.id)).toBe(true);
  },
);

When(
  "I close the created issue",
  async ({ pageObjects, scenarioState, seededOrganizationWithRepositories }) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [first] = repositories;
    const { number } = getCreatedIssue(scenarioState);

    if (!number) throw new Error("the scenario has not submitted the created issue yet");

    await pageObjects.issuePage.openFor(organizationName, first.name, number);
    await pageObjects.issuePage.close();
  },
);

Then(
  "the milestone counts {int} open and {int} closed issues at {int}% complete",
  async (
    { pageObjects, seededOrganizationWithRepositories, seededMilestone },
    open: number,
    closed: number,
    completeness: number,
  ) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [first] = repositories;

    await pageObjects.milestoneListPage.openFor(organizationName, first.name);

    const row = await pageObjects.milestoneListPage.waitForRow(seededMilestone.title);

    expect(row.openIssues).toBe(open);
    expect(row.closedIssues).toBe(closed);
    expect(row.completeness).toBe(completeness);
  },
);

When(
  "I reopen the created issue",
  async ({ pageObjects, scenarioState, seededOrganizationWithRepositories }) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [first] = repositories;
    const { number } = getCreatedIssue(scenarioState);

    if (!number) throw new Error("the scenario has not submitted the created issue yet");

    await pageObjects.issuePage.openFor(organizationName, first.name, number);
    await pageObjects.issuePage.reopen();
  },
);

When("I logout", async ({ sessionManager }) => {
  await sessionManager.logout();
});

When(
  "I login with valid credentials as user {int}",
  async ({ pageObjects, sessionManager, seededUsers }, userIndex: number) => {
    const user = seededUsers[userIndex - 1];

    await sessionManager.loginAs(user.username, user.password);
    // The Cucumber step signs in through the form and asserts the dashboard. Asserting it here
    // too is what tells a session that never landed from a page that never answers.
    await pageObjects.mainPage.open();
    expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
  },
);

Then("the organization page does not offer the owner actions", async ({ pageObjects }) => {
  expect(await pageObjects.orgRepositories.areMemberElementsVisible()).toBe(true);
});

Then(
  "the teams page does not offer to add a member to {string}",
  async ({ pageObjects }, team: string) => {
    await pageObjects.orgFacade.navigateToTeamsTab();

    expect(await pageObjects.orgTeams.doesNotHaveAddTeamMemberLink(team)).toBe(true);
  },
);

Then(
  "the created issue carries user {int} as assignee",
  async (
    { pageObjects, scenarioState, seededOrganizationWithRepositories, seededUsers },
    userIndex: number,
  ) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [first] = repositories;
    const { number } = getCreatedIssue(scenarioState);

    if (!number) throw new Error("the scenario has not submitted the created issue yet");

    await pageObjects.issuePage.openFor(organizationName, first.name, number);

    expect(await pageObjects.issuePage.getAssigneeNames()).toEqual([
      seededUsers[userIndex - 1].username,
    ]);
  },
);
