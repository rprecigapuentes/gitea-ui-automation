## Why

`project-board.feature` is the Cucumber smoke of the organization Kanban board, `S2-SMK-ISS`. One of its five scenarios already runs on Playwright, the drag and drop ported by `playwright-drag-and-drop-verification`; the other four exist only for Selenium, so the board is the one area of the runner comparison measured by a single case. It continues issue 104, which replicates the existing cases on the Playwright suite and already took the Vitest half.

## What Changes

- Add `tests/project-board.spec.ts` to `services/playwright-native`, replicating the four remaining scenarios of `project-board.feature` assertion by assertion, reaching the browser only through `pageObjects`:
  - the Basic Kanban template lays out Backlog, To Do, In Progress and Done, and Backlog is the default column;
  - an issue added to the project lands in the default column, which then counts one;
  - a column added from the board appears on it;
  - the default column does not offer to be deleted, the column that does is deleted, and its card is taken in by the new default.
- Add a `kanbanProject` fixture to `fixtures/hooks-fixtures.ts`, the Playwright form of the feature's `Background`. It depends on `seededOrganizationWithRepositories` and on `sessionManager`, creates the project from the template before `use()`, and hands the test its id and title. Deleting the organization already removes the project, so it needs no postcondition of its own.
- Tag each test with the existing `PROJECT_BOARD_TAG`, as the drag-and-drop spec does, so `--grep "@project-board"` selects the board smoke on either runner.
- Document the spec and the fixture in the `playwright-native` README.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Four existing scenarios are ported to a runner that already has its fixture layer, so no requirement text changes and `.openspec.yaml` sets `skip_specs: true`.

## Impact

New: `services/playwright-native/tests/project-board.spec.ts`. Modified: `services/playwright-native/fixtures/hooks-fixtures.ts`, `services/playwright-native/README.md`, and `business-logic/pages/projects/project-board.page.ts`, whose `addColumn` returned before the column reached the server. That page object is shared with the Selenium suites, so both run again. No pipeline change: the `playwright-native` job already runs everything under `tests/`, on the credentials it has.

## Out of Scope

- `demo-e2e.feature`, the `@e2e` work item lifecycle: its own change.
- `organizations.feature` and `login.feature`.
- `S2-SMK-ISS-06` and `S2-SMK-ISS-07`, which were never automated on Selenium either.
- Retiring the Cucumber scenarios: both suites keep running.
- Moving `seededOrganizationWithRepositories` into a board-specific fixture file: it would edit the merged drag-and-drop spec for no change in behaviour.
