## Why

`project-board.feature` is the Cucumber smoke of the organization Kanban board, `S2-SMK-ISS`. One of its five scenarios already runs on Playwright, the drag and drop ported by `playwright-drag-and-drop-verification`; the other four exist only for Selenium, so the board is the one area of the runner comparison measured by a single case. It continues issue 104, whose Vitest half is already done.

## What Changes

- Add `tests/project-board.spec.ts` to `services/playwright-native`, replicating the four remaining scenarios of `project-board.feature` assertion by assertion, reaching the browser only through `pageObjects`:
  - the Basic Kanban template lays out Backlog, To Do, In Progress and Done, and Backlog is the default column;
  - an issue added to the project lands in the default column, which then counts one;
  - a column added from the board appears on it;
  - the default column does not offer to be deleted, the column that does is deleted, and its card is taken in by the new default.
- Add a `kanbanProject` fixture in a new `fixtures/project-board-fixtures.ts`, the Playwright form of the feature's `Background`. It depends on `seededOrganizationWithRepositories` and on `sessionManager`, creates the project from the template before `use()`, and hands the test its id and title. Deleting the organization already removes the project, so it needs no postcondition of its own.
- Retire `fixtures/hooks-fixtures.ts`, named after the Cucumber hooks it replaced, with its author's agreement: its board seeding joins the file above, its two automatic cleanups go to `fixtures/fixture.ts`, which stays the transversal one.
- Document both fixture files in the `playwright-native` README.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None: porting existing scenarios changes no requirement, so `.openspec.yaml` sets `skip_specs: true`.

## Impact

In `services/playwright-native`: new `tests/project-board.spec.ts` and `fixtures/project-board-fixtures.ts`, deleted `fixtures/hooks-fixtures.ts`, modified `fixtures/fixture.ts`, `fixtures/visual.fixture.ts`, the two specs that imported the deleted file, and the README. Also `business-logic/pages/projects/project-board.page.ts` and its column fragment, whose three menu actions returned before the board had answered; that page object is shared with the Selenium suites, so both run again. No pipeline change.

## Out of Scope

- `demo-e2e.feature`, the `@e2e` work item lifecycle: its own change.
- `organizations.feature` and `login.feature`.
- `S2-SMK-ISS-06` and `S2-SMK-ISS-07`, which were never automated on Selenium either.
- Retiring the Cucumber scenarios: both suites keep running.
- Anything about how the other suites seed their own state: `hooks-fixtures.ts` is retired here, with its author's agreement, only because this change is what fed it last.
