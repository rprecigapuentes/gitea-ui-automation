// spec: services/playwright-bdd/features/scenarios/issue-metadata.feature
// seed: services/playwright-bdd/tests/seeds/issue-metadata.spec.ts

import { expect, When, Then } from "../../fixtures/fixture";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";
import type { ScenarioState } from "@gitea-automation/business-logic/state/scenario.entity";

const body = {
  heading: "Acceptance criteria",
  paragraph: "The issue has to carry every piece of metadata it was created with.",
};

const ISSUE_DESCRIPTION = `## ${body.heading}\n\n${body.paragraph}\n`;

/* The title travels through `scenarioState` rather than a variable in this file, which parallel
   workers share. */
function getCreatedIssue(scenarioState: ScenarioState): NonNullable<ScenarioState["createdIssue"]> {
  const createdIssue = scenarioState.createdIssue;

  if (!createdIssue) throw new Error("the scenario has not filled the issue form yet");

  return createdIssue;
}

function getCreatedIssueNumber(scenarioState: ScenarioState): number {
  const { number } = getCreatedIssue(scenarioState);

  if (number === undefined) throw new Error("the scenario has not submitted the issue yet");

  return number;
}

When(
  "I fill the issue with a title and a Markdown description",
  async ({ pageObjects, scenarioState }) => {
    const title = testDataName("ISS-01", "Issue");

    await pageObjects.createIssuePage.fillTitle(title);
    await pageObjects.createIssuePage.fillDescription(ISSUE_DESCRIPTION);

    scenarioState.createdIssue = { title, description: ISSUE_DESCRIPTION };
  },
);

When("I open the description preview", async ({ pageObjects }) => {
  await pageObjects.createIssuePage.openPreview();
});

Then("the description preview renders that heading and that paragraph", async ({ pageObjects }) => {
  expect(await pageObjects.createIssuePage.getPreviewHeadings()).toContain(body.heading);
  expect(await pageObjects.createIssuePage.getPreviewText()).toContain(body.paragraph);
});

When(
  "I select the seeded label, the seeded milestone and the maintainer as assignee",
  async ({ pageObjects, classificationLabel, milestone, maintainer }) => {
    await pageObjects.createIssuePage.selectLabel(classificationLabel.id);
    await pageObjects.createIssuePage.selectMilestone(milestone.id);
    await pageObjects.createIssuePage.selectAssignee(maintainer.id);
  },
);

Then(
  "the form shows the seeded label, the seeded milestone and the maintainer as selected",
  async ({ pageObjects, classificationLabel, milestone, maintainer }) => {
    expect(await pageObjects.createIssuePage.getSelectedLabelIds()).toEqual([
      classificationLabel.id,
    ]);
    expect(await pageObjects.createIssuePage.getSelectedMilestoneNames()).toEqual([
      milestone.title,
    ]);
    expect(await pageObjects.createIssuePage.getSelectedAssigneeNames()).toContain(
      maintainer.login,
    );
  },
);

Then(
  "the created issue carries that title and renders that paragraph",
  async ({ pageObjects, scenarioState }) => {
    const { title } = getCreatedIssue(scenarioState);

    expect(await pageObjects.issuePage.getTitle()).toBe(title);
    expect(await pageObjects.issuePage.getRenderedBody()).toContain(body.paragraph);
  },
);

Then(
  "the created issue carries the seeded label, the seeded milestone and the maintainer",
  async ({ pageObjects, classificationLabel, milestone, maintainer }) => {
    expect(await pageObjects.issuePage.getAppliedLabelIds()).toEqual([classificationLabel.id]);
    expect(await pageObjects.issuePage.getMilestoneName()).toBe(milestone.title);
    expect(await pageObjects.issuePage.getAssigneeNames()).toContain(maintainer.login);
  },
);

When(
  "I set the due date of the created issue to the seeded milestone's due date",
  async ({ pageObjects, milestone }) => {
    await pageObjects.issuePage.setDueDate(milestone.dueDate);
  },
);

Then("the created issue shows that due date", async ({ pageObjects, milestone }) => {
  const renderedDueDate = await pageObjects.issuePage.getDueDate();

  expect(renderedDueDate).toContain(String(milestone.dueDate.getUTCFullYear()));
  expect(renderedDueDate).toContain(String(milestone.dueDate.getUTCDate()));
});

When(
  "I filter the issue list of the repository by the seeded label",
  async ({ pageObjects, owner, repository, classificationLabel }) => {
    await pageObjects.issueListPage.openFor(owner, repository);
    await pageObjects.issueListPage.filterByLabel(classificationLabel.id);
  },
);

Then("the filtered issue list shows the created issue", async ({ pageObjects, scenarioState }) => {
  const { title } = getCreatedIssue(scenarioState);

  expect(await pageObjects.issueListPage.getIssueTitles()).toContain(title);
});

Then(
  "the created issue carries only the seeded label in the list",
  async ({ pageObjects, scenarioState, classificationLabel }) => {
    const { title } = getCreatedIssue(scenarioState);

    expect(await pageObjects.issueListPage.getLabelIdsOf(title)).toEqual([classificationLabel.id]);
  },
);

When(
  "I filter the issue list of the repository by the seeded milestone",
  async ({ pageObjects, owner, repository, milestone }) => {
    await pageObjects.issueListPage.openFor(owner, repository);
    await pageObjects.issueListPage.filterByMilestone(milestone.id);
  },
);

When(
  "I filter the issue list of the repository by no milestone",
  async ({ pageObjects, owner, repository }) => {
    await pageObjects.issueListPage.openFor(owner, repository);
    await pageObjects.issueListPage.filterByNoMilestone();
  },
);

Then(
  "the filtered issue list does not show the created issue",
  async ({ pageObjects, scenarioState }) => {
    const { title } = getCreatedIssue(scenarioState);

    expect(await pageObjects.issueListPage.getIssueTitles()).not.toContain(title);
  },
);

Then(
  "the seeded milestone counts {int} open and {int} closed issues at {int}% complete",
  async (
    { pageObjects, owner, repository, milestone },
    openIssues: number,
    closedIssues: number,
    completeness: number,
  ) => {
    await pageObjects.milestoneListPage.openFor(owner, repository);

    const row = await pageObjects.milestoneListPage.waitForRow(milestone.title);

    expect(row.openIssues).toBe(openIssues);
    expect(row.closedIssues).toBe(closedIssues);
    expect(row.completeness).toBe(completeness);
  },
);

When(
  "I close the created issue of the repository",
  async ({ pageObjects, scenarioState, owner, repository }) => {
    await pageObjects.issuePage.openFor(owner, repository, getCreatedIssueNumber(scenarioState));
    await pageObjects.issuePage.close();
  },
);
