// spec: services/playwright-bdd/features/scenarios/project-board.feature
// seed: services/playwright-bdd/tests/seeds/board.spec.ts

import { expect, Given, When, Then } from "../../fixtures/fixture";
import type { PageFactory } from "@gitea-automation/business-logic/pages/page.factory";
import type { SeededRepository } from "@gitea-automation/business-logic/state/scenario.entity";

const TEMPLATE_COLUMNS = ["Backlog", "To Do", "In Progress", "Done"];

async function addIssueToProject(
  pageObjects: PageFactory,
  organizationName: string,
  repository: SeededRepository,
  projectId: number,
): Promise<void> {
  await pageObjects.issuePage.openFor(organizationName, repository.name, repository.issue.number);
  await pageObjects.issuePage.assignProject(projectId);
}

Given(
  "the seeded organization has two repositories with one issue each",
  ({ seededOrganizationWithRepositories }) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;

    expect(organizationName).toBeTruthy();
    expect(repositories).toHaveLength(2);
  },
);

Given("I am logged in as the organization owner", async ({ sessionManager }) => {
  await sessionManager.loginAsOwner();
});

// Referencing `kanbanProject` is what creates the project; there is no separate action.
Given("a project created from the Basic Kanban template", ({ kanbanProject }) => {
  expect(kanbanProject.id).toBeTruthy();
});

Given(
  "the first seeded issue is in the default column",
  async ({ pageObjects, seededOrganizationWithRepositories, kanbanProject }) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [first] = repositories;

    await addIssueToProject(pageObjects, organizationName, first, kanbanProject.id);
  },
);

Given(
  "the seeded issues of both repositories are in the default column",
  async ({ pageObjects, seededOrganizationWithRepositories, kanbanProject }) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;

    for (const repository of repositories) {
      await addIssueToProject(pageObjects, organizationName, repository, kanbanProject.id);
    }
  },
);

Given("the column {string} is made the default column", async ({ pageObjects }, title: string) => {
  await pageObjects.projectBoardPage.makeColumnDefault(title);
});

// Appears in the feature both as `When` and as `And` after a `Given`; playwright-bdd does not match
// on keyword, so one definition serves both.
When(
  "I open the project board",
  async ({ pageObjects, seededOrganizationWithRepositories, kanbanProject }) => {
    await pageObjects.projectBoardPage.openFor(
      seededOrganizationWithRepositories.organizationName,
      kanbanProject.id,
    );
  },
);

When(
  "I add the first seeded issue to the project",
  async ({ pageObjects, seededOrganizationWithRepositories, kanbanProject }) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [first] = repositories;

    await addIssueToProject(pageObjects, organizationName, first, kanbanProject.id);
  },
);

When("I add the column {string} to the board", async ({ pageObjects }, title: string) => {
  await pageObjects.projectBoardPage.addColumn(title);
});

When(
  "I drag the first seeded issue onto the column {string}",
  async ({ pageObjects, seededOrganizationWithRepositories }, title: string) => {
    const [first] = seededOrganizationWithRepositories.repositories;

    await pageObjects.projectBoardPage.moveCard(first.issue.id, title);
  },
);

When("I delete the column {string}", async ({ pageObjects }, title: string) => {
  await pageObjects.projectBoardPage.deleteColumn(title);
});

Then(
  "the board shows the columns Backlog, To Do, In Progress and Done",
  async ({ pageObjects }) => {
    expect(await pageObjects.projectBoardPage.getColumnTitles()).toEqual(TEMPLATE_COLUMNS);
  },
);

Then("the default column is {string}", async ({ pageObjects }, title: string) => {
  expect(await pageObjects.projectBoardPage.getDefaultColumnTitle()).toBe(title);
});

Then(
  "the default column holds the first seeded issue",
  async ({ pageObjects, seededOrganizationWithRepositories }) => {
    const [first] = seededOrganizationWithRepositories.repositories;

    expect(await pageObjects.projectBoardPage.defaultColumnHoldsIssue(first.issue.id)).toBe(true);
  },
);

Then("the default column counts {int} issue(s)", async ({ pageObjects }, count: number) => {
  expect(await pageObjects.projectBoardPage.getDefaultColumnIssueCount()).toBe(count);
});

Then(
  "the default column holds only the second seeded issue",
  async ({ pageObjects, seededOrganizationWithRepositories }) => {
    const [, second] = seededOrganizationWithRepositories.repositories;

    expect(await pageObjects.projectBoardPage.getDefaultColumnCardIssueIds()).toEqual([
      second.issue.id,
    ]);
  },
);

Then("the board shows the column {string}", async ({ pageObjects }, title: string) => {
  expect(await pageObjects.projectBoardPage.isColumnVisible(title)).toBe(true);
});

Then("the board does not show the column {string}", async ({ pageObjects }, title: string) => {
  expect(await pageObjects.projectBoardPage.boardHidesColumn(title)).toBe(true);
});

Then(
  "the column {string} holds only the first seeded issue",
  async ({ pageObjects, seededOrganizationWithRepositories }, title: string) => {
    const [first] = seededOrganizationWithRepositories.repositories;

    expect(await pageObjects.projectBoardPage.getColumnCardIssueIds(title)).toEqual([
      first.issue.id,
    ]);
  },
);

Then(
  "the column {string} counts {int} issue(s)",
  async ({ pageObjects }, title: string, count: number) => {
    expect(await pageObjects.projectBoardPage.getColumnIssueCount(title)).toBe(count);
  },
);

Then("the column {string} offers to be deleted", async ({ pageObjects }, title: string) => {
  expect(await pageObjects.projectBoardPage.columnOffersDelete(title)).toBe(true);
});

Then("the column {string} does not offer to be deleted", async ({ pageObjects }, title: string) => {
  expect(await pageObjects.projectBoardPage.columnOffersDelete(title)).toBe(false);
});

Then(
  "the column {string} holds the first seeded issue",
  async ({ pageObjects, seededOrganizationWithRepositories }, title: string) => {
    const [first] = seededOrganizationWithRepositories.repositories;

    expect(await pageObjects.projectBoardPage.columnHoldsIssue(title, first.issue.id)).toBe(true);
  },
);
