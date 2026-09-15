import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "vitest";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";
import { getSeededUser } from "../support/seeded-users";
import {
  createdIssue,
  createdIssueNumber,
  createdLabel,
  firstSeededRepository,
  organizationName,
  projectId,
  secondSeededRepository,
  seededMilestone,
} from "../support/scenario-state";
import type { GiteaWorld } from "../support/world";

const ISSUE_DESCRIPTION_HEADING = "Demo work item";
const ISSUE_DESCRIPTION = `# ${ISSUE_DESCRIPTION_HEADING}\n\nThe item the demo follows from assignment to close.`;
const LABEL_COLOR = "#e11d48";

Given("the teams page of the organization is open", async function (this: GiteaWorld) {
  await this.pages.orgFacade.open();
  await this.pages.orgFacade.waitForElements();
  await this.pages.orgFacade.navigateToTeamsTab();
});

Then("the team {string} has no members yet", async function (this: GiteaWorld, team: string) {
  await this.pages.orgFacade.navigateToTeamsTab();
  await this.pages.orgFacade.navigateToSpecificTeam(team);

  expect(await this.pages.orgSpecificTeam.hasEmptyMembersMessage()).toBe(true);
});

When(
  "I add the first seeded repository to the team {string}",
  async function (this: GiteaWorld, team: string) {
    await this.pages.orgFacade.navigateToTeamsTab();
    await this.pages.orgFacade.navigateToSpecificTeam(team);
    await this.pages.orgSpecificTeam.navigateToRepositoriesTab();
    await this.pages.orgSpecificTeam.addRepository(firstSeededRepository(this).name);
  },
);

When("I open the new issue form of the first seeded repository", async function (this: GiteaWorld) {
  await this.pages.createIssuePage.openFor(
    organizationName(this),
    firstSeededRepository(this).name,
  );
});

Then("the assignee list offers user {int}", async function (this: GiteaWorld, userIndex: number) {
  expect(await this.pages.createIssuePage.offersAssignee(getSeededUser(userIndex).id)).toBe(true);
});

Then(
  "the assignee list does not offer user {int}",
  async function (this: GiteaWorld, userIndex: number) {
    expect(await this.pages.createIssuePage.offersAssignee(getSeededUser(userIndex).id)).toBe(
      false,
    );
  },
);

When(
  "I create the scoped label {string} in the first seeded repository",
  async function (this: GiteaWorld, name: string) {
    await this.pages.labelListPage.openFor(
      organizationName(this),
      firstSeededRepository(this).name,
    );

    const row = await this.pages.labelListPage.createScopedLabel({
      name,
      description: "Set by the demo end to end",
      color: LABEL_COLOR,
    });

    this.scenarioState.label = { id: row.id, name: row.name };
  },
);

When(
  "I fill the issue {string} with a description",
  async function (this: GiteaWorld, title: string) {
    const uniqueTitle = testDataName("S2-DEMO-ISS", title);

    await this.pages.createIssuePage.fillTitle(uniqueTitle);
    await this.pages.createIssuePage.fillDescription(ISSUE_DESCRIPTION);

    this.scenarioState.createdIssue = { title: uniqueTitle };
  },
);

Then(
  "the description preview renders the heading {string}",
  async function (this: GiteaWorld, heading: string) {
    await this.pages.createIssuePage.openPreview();

    expect(await this.pages.createIssuePage.getPreviewHeadings()).toContain(heading);
  },
);

When(
  "I select the label, the milestone and user {int} as assignee",
  async function (this: GiteaWorld, userIndex: number) {
    await this.pages.createIssuePage.selectLabel(createdLabel(this).id);
    await this.pages.createIssuePage.selectMilestone(seededMilestone(this).id);
    await this.pages.createIssuePage.selectAssignee(getSeededUser(userIndex).id);
  },
);

When("I submit the issue", async function (this: GiteaWorld) {
  await this.pages.createIssuePage.submit();

  this.scenarioState.createdIssue = {
    ...createdIssue(this),
    number: await this.pages.issuePage.getIssueNumber(),
  };
});

Then(
  "the created issue carries the label, the milestone and user {int} as assignee",
  async function (this: GiteaWorld, userIndex: number) {
    expect(await this.pages.issuePage.getAppliedLabelIds()).toEqual([createdLabel(this).id]);
    expect(await this.pages.issuePage.getMilestoneName()).toBe(seededMilestone(this).title);
    expect(await this.pages.issuePage.getAssigneeNames()).toEqual([
      getSeededUser(userIndex).username,
    ]);
  },
);

Then(
  "the created issue carries user {int} as assignee",
  async function (this: GiteaWorld, userIndex: number) {
    await this.pages.issuePage.openFor(
      organizationName(this),
      firstSeededRepository(this).name,
      createdIssueNumber(this),
    );

    expect(await this.pages.issuePage.getAssigneeNames()).toEqual([
      getSeededUser(userIndex).username,
    ]);
  },
);

When(
  "I filter the issue list of the first seeded repository by the label",
  async function (this: GiteaWorld) {
    await this.pages.issueListPage.openFor(
      organizationName(this),
      firstSeededRepository(this).name,
    );
    await this.pages.issueListPage.filterByLabel(createdLabel(this).id);
  },
);

Then("the issue list shows only the created issue", async function (this: GiteaWorld) {
  expect(await this.pages.issueListPage.getIssueTitles()).toEqual([createdIssue(this).title]);
});

Given("the created issue is in the default column", async function (this: GiteaWorld) {
  await this.pages.issuePage.openFor(
    organizationName(this),
    firstSeededRepository(this).name,
    createdIssueNumber(this),
  );
  await this.pages.issuePage.assignProject(projectId(this));
});

When(
  "I drag the second seeded issue onto the column {string}",
  async function (this: GiteaWorld, title: string) {
    await this.pages.projectBoardPage.moveCard(secondSeededRepository(this).issue.id, title);
  },
);

Then(
  "the column {string} holds only the second seeded issue",
  async function (this: GiteaWorld, title: string) {
    expect(await this.pages.projectBoardPage.getColumnCardIssueIds(title)).toEqual([
      secondSeededRepository(this).issue.id,
    ]);
  },
);

Then("the default column holds the second seeded issue", async function (this: GiteaWorld) {
  expect(
    await this.pages.projectBoardPage.defaultColumnHoldsIssue(
      secondSeededRepository(this).issue.id,
    ),
  ).toBe(true);
});

When("I close the created issue", async function (this: GiteaWorld) {
  await this.pages.issuePage.openFor(
    organizationName(this),
    firstSeededRepository(this).name,
    createdIssueNumber(this),
  );
  await this.pages.issuePage.close();
});

When("I reopen the created issue", async function (this: GiteaWorld) {
  await this.pages.issuePage.openFor(
    organizationName(this),
    firstSeededRepository(this).name,
    createdIssueNumber(this),
  );
  await this.pages.issuePage.reopen();
});

Then("the created issue is {string}", async function (this: GiteaWorld, state: string) {
  expect(await this.pages.issuePage.getState()).toBe(state);
});

Then(
  "the milestone counts {int} open and {int} closed issues at {int}% complete",
  async function (this: GiteaWorld, open: number, closed: number, completeness: number) {
    await this.pages.milestoneListPage.openFor(
      organizationName(this),
      firstSeededRepository(this).name,
    );

    const row = await this.pages.milestoneListPage.waitForRow(seededMilestone(this).title);

    expect(row.openIssues).toBe(open);
    expect(row.closedIssues).toBe(closed);
    expect(row.completeness).toBe(completeness);
  },
);

Then("the organization page does not offer the owner actions", async function (this: GiteaWorld) {
  expect(await this.pages.orgRepositories.areMemberElementsVisible()).toBe(true);
});

Then(
  "the teams page does not offer to add a member to {string}",
  async function (this: GiteaWorld, team: string) {
    await this.pages.orgFacade.navigateToTeamsTab();

    expect(await this.pages.orgTeams.doesNotHaveAddTeamMemberLink(team)).toBe(true);
  },
);
