// spec: services/playwright-bdd/features/scenarios/scoped-labels.feature
// seed: services/playwright-bdd/tests/seeds/scoped-labels.spec.ts

import type { DataTable } from "playwright-bdd";
import { expect, When, Then } from "../../fixtures/fixture";
import type { ScenarioState } from "@gitea-automation/business-logic/state/scenario.entity";
import type { SeededLabel } from "@gitea-automation/business-logic/entities/label.entity";

/* A label is known by the name the feature gives it: its id is Gitea's, and is stored in
   `scenarioState` once the row has been read back, since parallel workers share this file. */
function getCreatedLabel(scenarioState: ScenarioState, name: string): SeededLabel {
  const created = scenarioState.createdLabels?.[name];

  if (!created) throw new Error(`the scenario has not created the label "${name}" yet`);

  return created;
}

function recordLabel(scenarioState: ScenarioState, label: SeededLabel): void {
  scenarioState.createdLabels = { ...scenarioState.createdLabels, [label.name]: label };
}

function getCreatedLabelIds(scenarioState: ScenarioState, names: string[]): number[] {
  return names.map((name) => getCreatedLabel(scenarioState, name).id);
}

When("I open the label list of the repository", async ({ pageObjects, owner, repository }) => {
  await pageObjects.labelListPage.openFor(owner, repository);
});

When("I open the new label form", async ({ pageObjects }) => {
  await pageObjects.labelListPage.openNewLabelForm();
});

Then("the exclusive option is disabled", async ({ pageObjects }) => {
  expect(await pageObjects.labelListPage.isExclusiveFieldEnabled()).toBe(false);
});

When("I name the label {string}", async ({ pageObjects }, name: string) => {
  await pageObjects.labelListPage.fillName(name);
});

Then("the exclusive option is enabled", async ({ pageObjects }) => {
  expect(await pageObjects.labelListPage.isExclusiveFieldEnabled()).toBe(true);
});

When(
  "I mark {string} exclusive and submit it described {string} and coloured {string}",
  async ({ pageObjects, scenarioState }, name: string, description: string, colour: string) => {
    await pageObjects.labelListPage.markExclusive();
    await pageObjects.labelListPage.fillDescription(description);
    await pageObjects.labelListPage.fillColor(colour);
    await pageObjects.labelListPage.submitLabelForm();

    const row = await pageObjects.labelListPage.waitForLabel(name);

    recordLabel(scenarioState, { id: row.id, name: row.name });
  },
);

Then(
  "the label list shows {string} as exclusive, coloured {string} and described {string}",
  async ({ pageObjects }, name: string, colour: string, description: string) => {
    const row = await pageObjects.labelListPage.waitForLabel(name);

    expect(row.exclusive).toBe(true);
    expect(row.color).toBe(colour);
    expect(row.description).toBe(description);
  },
);

Then(
  "the label {string} reads as the scope {string} and the item {string}",
  async ({ pageObjects }, name: string, scope: string, item: string) => {
    const chip = await pageObjects.labelListPage.getChip(name);

    expect(await chip.getScopeAndItem()).toEqual([scope, item]);
  },
);

When(
  "I create these exclusive labels:",
  async ({ pageObjects, scenarioState }, labels: DataTable) => {
    for (const row of labels.hashes()) {
      const created = await pageObjects.labelListPage.createScopedLabel({
        name: row.name,
        description: row.description,
        color: row.colour,
      });

      recordLabel(scenarioState, { id: created.id, name: created.name });
    }
  },
);

When("I open the seeded issue", async ({ pageObjects, owner, repository, issue }) => {
  await pageObjects.issuePage.openFor(owner, repository, issue.number);
});

When(
  "I apply the label {string} to the issue",
  async ({ pageObjects, scenarioState }, name: string) => {
    await pageObjects.issuePage.applyLabel(getCreatedLabel(scenarioState, name).id);
  },
);

Then(
  "the issue carries only the label {string}",
  async ({ pageObjects, scenarioState }, name: string) => {
    await pageObjects.issuePage.waitForAppliedLabels(getCreatedLabelIds(scenarioState, [name]));
  },
);

Then(
  "the last label event names {string}",
  async ({ pageObjects, scenarioState }, name: string) => {
    expect(await pageObjects.issuePage.getLastLabelEvent()).toContain(
      getCreatedLabel(scenarioState, name).id,
    );
  },
);

Then(
  "the issue carries only the labels {string} and {string}",
  async ({ pageObjects, scenarioState }, first: string, second: string) => {
    await pageObjects.issuePage.waitForAppliedLabels(
      getCreatedLabelIds(scenarioState, [first, second]),
    );
  },
);

When(
  "I filter the issue list of the repository by the label {string}",
  async ({ pageObjects, scenarioState, owner, repository }, name: string) => {
    await pageObjects.issueListPage.openFor(owner, repository);
    await pageObjects.issueListPage.filterByLabel(getCreatedLabel(scenarioState, name).id);
  },
);

Then("the filtered issue list shows the seeded issue", async ({ pageObjects, issue }) => {
  expect(await pageObjects.issueListPage.getIssueTitles()).toContain(issue.title);
});

Then(
  "the seeded issue carries the labels {string} and {string} in the list",
  async ({ pageObjects, scenarioState, issue }, first: string, second: string) => {
    expect(await pageObjects.issueListPage.getLabelIdsOf(issue.title)).toEqual(
      expect.arrayContaining(getCreatedLabelIds(scenarioState, [first, second])),
    );
  },
);

Then("the filtered issue list does not show the seeded issue", async ({ pageObjects, issue }) => {
  expect(await pageObjects.issueListPage.getIssueTitles()).not.toContain(issue.title);
});

When(
  "I remove the label {string} from the issue",
  async ({ pageObjects, scenarioState }, name: string) => {
    await pageObjects.issuePage.removeLabel(getCreatedLabel(scenarioState, name).id);
  },
);

Then("the label list counts these issues:", async ({ pageObjects }, counts: DataTable) => {
  for (const row of counts.hashes()) {
    const labelRow = await pageObjects.labelListPage.waitForLabel(row.label);

    expect(labelRow.issueCount).toBe(Number(row.issues));
  }
});
