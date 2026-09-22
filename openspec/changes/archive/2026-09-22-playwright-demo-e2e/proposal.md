## Why

`demo-e2e.feature` is the last Cucumber scenario of issue 104 that still runs only on Selenium. It is the one case that crosses every area at once: team permissions, an issue with its metadata, the board, the milestone, and what a non-owner sees. Until it runs on Playwright, the comparison has no data on a long case.

## What Changes

- Add `tests/demo-e2e.spec.ts` to `services/playwright-native`, replicating the scenario as **one test**, with a `test.step` per phase of the feature file, the way `organizations-e2e.spec.ts` stands in for Allure's steps. It is one narrative where every phase depends on the state the last one left, so splitting it would change what is being tested.
- Chain `fixtures/project-board-fixtures.ts` onto `fixtures/organizations-fixtures.ts` instead of `fixtures/fixture.ts`. The scenario needs the board's seeded organization and the organization port's `seededUsers` at once, and the two files extend `fixture.ts` as siblings today, so neither composes with the other. Playwright resolves a fixture only when a test asks for it, so the board specs gain nothing they will run.
- Give `SeededUser` the `id` the assignee list is read by. `UserClient.createUser` already returns it and the fixture discards it.
- Add `seededMilestone` to `fixtures/project-board-fixtures.ts`, on the seeded organization's first repository, due in seven days as the Cucumber hook sets it.
- Record the seeded organization in `scenarioState` from `seededOrganizationWithRepositories`, and clear it before deleting. `PageFactory` reads the organization from there, so `orgFacade` cannot be built without it.

The Kanban project is created in the test where the feature file creates it, halfway through, not through the `kanbanProject` fixture: a fixture runs before the body, and the order is part of what the scenario asserts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None: porting an existing scenario changes no requirement, so `.openspec.yaml` sets `skip_specs: true`.

## Impact

New: `tests/demo-e2e.spec.ts`. Modified: `fixtures/project-board-fixtures.ts`, `fixtures/organizations-fixtures.ts`, the README. The admin token, `resolveAdminToken` and `seededUsers` already landed with the organization port, so this change adds none of them.

## Out of Scope

- Splitting the scenario into smaller cases, or changing what it asserts.
- A timeout of its own for the case: the suite already declares 120 seconds globally, and a timeout that hides a real failure is worse than a slow run that reports one.
- Retiring the Cucumber scenario: both suites keep running.
- Any page-object change beyond what the port turns out to require, logged with the failure that found it.
