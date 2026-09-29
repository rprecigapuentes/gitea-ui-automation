# Proposal

## Why

Two cases separate `playwright-bdd` from the runners it is measured against. `AT-ISS-01` walks an
issue's metadata — a Markdown description, a label, a milestone and an assignee — through both list
filters and into the milestone it completes when it closes. `AT-ISS-02` proves a scoped label
replaces the label of its own scope, coexists with another scope, and leaves the issue when it is
removed. Both exist in `gitea-selenium-vitest` and in `playwright-native`, and neither exists as
Gherkin anywhere.

The Cucumber service has no issue feature, so there is nothing to copy: its four are already
carried here byte for byte. The Gherkin is authored here from the assertions the Vitest cases make,
as `create-organization.feature` was.

`create-issue.feature` was tagged `@skip` for this — "AT-ISS-01 (once ported here) covers this and
more". Porting it is what makes that skip true rather than a gap.

## What Changes

- `services/playwright-bdd` gains `issue-metadata.feature` and `scoped-labels.feature`, one
  scenario each, keeping every assertion of the two Vitest cases, and the step definitions they
  resolve to, written by the Playwright generator.
- Four of `issue-metadata.feature`'s steps are already defined by `create-issue.steps.ts` and SHALL
  NOT be written again: two definitions matching one step make the run ambiguous. That file stays
  on disk for them, though its own scenario compiles into no test.
- A starting state per feature, so each generator run explores the world its scenario needs.
- `ScenarioState` gains `createdLabels`: the second scenario creates three labels through the
  browser and reads all three back by name, where the existing `label` is singular and holds
  `demo-e2e`'s.

Out of scope: page objects and fixtures, which `playwright-native` already proves complete here; the
Cucumber service, which keeps no issue feature; deleting anything from `playwright-native`, since
the suites carry the same cases on purpose; and the shared `playwright-report/` and `test-results/`
directories this service's three parallel processes overwrite, which is pre-existing and its own
change.

## Capabilities

No requirement changes. `playwright-bdd` already requires that each step resolves to exactly one
definition and reaches the browser only through a page object; `agent-test-generation` already
requires that a scenario names the starting state it was explored from and reads fixture-owned
values from fixtures. `.openspec.yaml` records `skip_specs: true`.

## Impact

- `services/playwright-bdd/features/`: two features and two step-definition files, all new.
- `services/playwright-bdd/tests/seeds/`: two starting states added.
- `business-logic/state/scenario.entity.ts`: one optional field, shared with the Selenium services.
- `services/playwright-bdd/README.md`: its two tables, both behind what the service holds.
