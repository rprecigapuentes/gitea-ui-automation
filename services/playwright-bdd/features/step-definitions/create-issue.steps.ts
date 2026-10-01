// spec: services/playwright-bdd/features/scenarios/create-issue.feature
// seed: services/playwright-bdd/tests/seeds/seed.spec.ts

import { expect, Given, When, Then } from "../../fixtures/fixture";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";
import type { ScenarioState } from "@gitea-automation/business-logic/state/scenario.entity";

const ISSUE_DESCRIPTION = "Description created by the create-issue BDD scenario.";

/* The title and the description travel through `scenarioState` rather than a variable in this
   file: module state lives as long as the worker, so it would leak into its next scenario. */
function getCreatedIssue(scenarioState: ScenarioState): NonNullable<ScenarioState["createdIssue"]> {
  const createdIssue = scenarioState.createdIssue;

  if (!createdIssue) throw new Error("the scenario has not filled the issue form yet");

  return createdIssue;
}

Given("I am signed in as the repository owner", async ({ sessionManager }) => {
  await sessionManager.loginAsOwner();
});

When("I open the new issue form of the repository", async ({ pageObjects, owner, repository }) => {
  await pageObjects.createIssuePage.openFor(owner, repository);
});

When("I fill the issue with a title and a description", async ({ pageObjects, scenarioState }) => {
  const title = testDataName("CI-01", "Issue");

  await pageObjects.createIssuePage.fillTitle(title);
  await pageObjects.createIssuePage.fillDescription(ISSUE_DESCRIPTION);

  scenarioState.createdIssue = { title, description: ISSUE_DESCRIPTION };
});

When("I submit the issue", async ({ pageObjects, scenarioState }) => {
  await pageObjects.createIssuePage.submit();

  scenarioState.createdIssue = {
    ...getCreatedIssue(scenarioState),
    number: await pageObjects.issuePage.getIssueNumber(),
  };
});

Then(
  "the created issue carries that title and that description",
  async ({ pageObjects, scenarioState }) => {
    const { title, description } = getCreatedIssue(scenarioState);

    expect(await pageObjects.issuePage.getTitle()).toBe(title);
    expect(await pageObjects.issuePage.getRenderedBody()).toBe(description);
  },
);

Then("the created issue is {string}", async ({ pageObjects }, state: string) => {
  expect(await pageObjects.issuePage.getState()).toBe(state);
});

Then(
  "the issue list of the repository shows the created issue",
  async ({ pageObjects, scenarioState, owner, repository }) => {
    const { title } = getCreatedIssue(scenarioState);

    await pageObjects.issueListPage.openFor(owner, repository);

    expect(await pageObjects.issueListPage.getIssueTitles()).toContain(title);
  },
);
