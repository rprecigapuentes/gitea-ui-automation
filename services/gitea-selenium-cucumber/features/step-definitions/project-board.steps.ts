import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "vitest";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";
import type { SeededRepository } from "@gitea-automation/business-logic-selenium/state/scenario.entity";
import { resolveOwnerCredentials } from "../support/credentials";
import type { GiteaWorld } from "../support/world";

const TEMPLATE_COLUMNS = ["Backlog", "To Do", "In Progress", "Done"];

function organizationName(world: GiteaWorld): string {
  const organization = world.scenarioState.organization;

  if (!organization) throw new Error("the scenario was not seeded with an organization");

  return organization.name;
}

function projectId(world: GiteaWorld): number {
  const project = world.scenarioState.project;

  if (!project) throw new Error("the scenario has not created a project yet");

  return project.id;
}

function firstSeededRepository(world: GiteaWorld): SeededRepository {
  const [repository] = world.scenarioState.repositories ?? [];

  if (!repository) throw new Error("the scenario was not seeded with repositories");

  return repository;
}

async function addFirstSeededIssueToProject(world: GiteaWorld): Promise<void> {
  const repository = firstSeededRepository(world);

  await world.pages.issuePage.openFor(
    organizationName(world),
    repository.name,
    repository.issue.number,
  );
  await world.pages.issuePage.assignProject(projectId(world));
}

Given(
  "the seeded organization has two repositories with one issue each",
  function (this: GiteaWorld) {
    expect(organizationName(this)).toBeTruthy();
    expect(this.scenarioState.repositories).toHaveLength(2);
  },
);

Given("I am logged in as the organization owner", async function (this: GiteaWorld) {
  const { username, password } = resolveOwnerCredentials();

  await this.pages.loginPage.open();
  await this.pages.loginPage.login(username, password);
  expect(await this.pages.mainPage.hasExpectedElementsDisplayed()).toBe(true);
});

Given("a project created from the Basic Kanban template", async function (this: GiteaWorld) {
  const owner = organizationName(this);
  const title = testDataName("S2-SMK-ISS", "Project");

  await this.pages.createProjectPage.openFor(owner);
  await this.pages.createProjectPage.createFromBasicKanban(title);
  await this.pages.projectListPage.openFor(owner);

  this.scenarioState.project = {
    id: await this.pages.projectListPage.getOnlyProjectId(),
    title,
  };
});

Given("the first seeded issue is in the default column", async function (this: GiteaWorld) {
  await addFirstSeededIssueToProject(this);
});

Given(
  "the column {string} is made the default column",
  async function (this: GiteaWorld, title: string) {
    await this.pages.projectBoardPage.makeColumnDefault(title);
  },
);

When("I open the project board", async function (this: GiteaWorld) {
  await this.pages.projectBoardPage.openFor(organizationName(this), projectId(this));
});

When("I add the first seeded issue to the project", async function (this: GiteaWorld) {
  await addFirstSeededIssueToProject(this);
});

When("I add the column {string} to the board", async function (this: GiteaWorld, title: string) {
  await this.pages.projectBoardPage.addColumn(title);
});

When("I delete the column {string}", async function (this: GiteaWorld, title: string) {
  await this.pages.projectBoardPage.deleteColumn(title);
});

Then(
  "the board shows the columns Backlog, To Do, In Progress and Done",
  async function (this: GiteaWorld) {
    expect(await this.pages.projectBoardPage.getColumnTitles()).toEqual(TEMPLATE_COLUMNS);
  },
);

Then("the default column is {string}", async function (this: GiteaWorld, title: string) {
  expect(await this.pages.projectBoardPage.getDefaultColumnTitle()).toBe(title);
});

Then("the default column holds the first seeded issue", async function (this: GiteaWorld) {
  const { issue } = firstSeededRepository(this);

  expect(await this.pages.projectBoardPage.defaultColumnHoldsIssue(issue.id)).toBe(true);
});

Then("the default column counts {int} issue(s)", async function (this: GiteaWorld, count: number) {
  expect(await this.pages.projectBoardPage.getDefaultColumnIssueCount()).toBe(count);
});

Then("the board shows the column {string}", async function (this: GiteaWorld, title: string) {
  expect(await this.pages.projectBoardPage.isColumnVisible(title)).toBe(true);
});

Then(
  "the board does not show the column {string}",
  async function (this: GiteaWorld, title: string) {
    expect(await this.pages.projectBoardPage.boardHidesColumn(title)).toBe(true);
  },
);

Then("the column {string} offers to be deleted", async function (this: GiteaWorld, title: string) {
  expect(await this.pages.projectBoardPage.columnOffersDelete(title)).toBe(true);
});

Then(
  "the column {string} does not offer to be deleted",
  async function (this: GiteaWorld, title: string) {
    expect(await this.pages.projectBoardPage.columnOffersDelete(title)).toBe(false);
  },
);

Then(
  "the column {string} holds the first seeded issue",
  async function (this: GiteaWorld, title: string) {
    const { issue } = firstSeededRepository(this);

    expect(await this.pages.projectBoardPage.columnHoldsIssue(title, issue.id)).toBe(true);
  },
);
