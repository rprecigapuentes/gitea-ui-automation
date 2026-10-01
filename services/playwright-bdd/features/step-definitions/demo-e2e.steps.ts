// spec: services/playwright-bdd/features/scenarios/demo-e2e.feature
// seed: services/playwright-bdd/tests/seeds/demo.spec.ts

import { expect, Given, When, Then } from "../../fixtures/fixture";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";
import type { ScenarioState } from "@gitea-automation/business-logic/state/scenario.entity";

const LABEL_DESCRIPTION = "Set by the demo end to end";
const LABEL_COLOR = "#e11d48";
const ISSUE_DESCRIPTION_TAIL = "The item the demo follows from assignment to close.";

/* The title and description travel through `scenarioState` rather than a variable in this file:
   module state lives as long as the worker, so it would leak into its next scenario. */
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
