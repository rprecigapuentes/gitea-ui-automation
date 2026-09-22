## 1. Background fixture

- [x] 1.1 Add `kanbanProject` to `fixtures/hooks-fixtures.ts`, creating the project from the Basic Kanban template on `seededOrganizationWithRepositories` and handing the test its id and title; verify by having the first ported test read the id and open the board

## 2. Port the four scenarios

- [x] 2.1 Write the board layout and the issue landing in the default column in `tests/project-board.spec.ts`, and verify both pass on firefox with no assertion dropped against `project-board.feature`
- [x] 2.2 Write the column added from the board, and the default column that cannot be deleted and takes in the cards of the deleted one, and verify both pass on firefox
- [ ] 2.3 Run the four on chrome, firefox and edge, alone and with `test:parallel`, and verify the run is green on each

Green on firefox, 4 of 4. Chrome and edge are unrun: their branded builds are not installed on this machine, only Playwright's bundled Chromium and Firefox, the same limitation `playwright-issue-e2e` recorded.

The last scenario asserts two negatives, `columnOffersDelete` false and `boardHidesColumn`, which the fragments check with the instant, non-waiting `isVisible`. That is the divergence `playwright-drag-and-drop-verification` fixed in the strategy, so it is the first place to look if 2.2 hangs instead of failing. Any further point where `PlaywrightInteractionStrategy` turns out to disagree with the Selenium contract gets its own task here, with what was found and why, as `playwright-organization-e2e` and `playwright-issue-e2e` did.

## 3. Let the board page answer for the column it adds

Found while running 2.2, and agreed with the author before touching a page object the Selenium suites share. The column never reached the server: `addColumn` returned as soon as it clicked the modal's save button, with the modal still open and the `POST .../columns/new` in flight, so the navigation that followed aborted it. The test failed on `isColumnVisible("Review")` and then on its own 30 second timeout, with the board holding only the four template columns. Selenium never saw this: a driver round trip is slower than the in-process call that replaced it, so the request had always finished by the time the next step navigated. Measured without reloading, the board renders the column by itself about 500 ms after the click, so the effect is observable where the interaction happened.

- [ ] 3.1 `addColumn` waits for the column to be on the board with `clickAndWaitUntil`, the mechanism `moveCard` already uses to answer for the state the server kept; verify the scenario passes on firefox and the Cucumber `@project-board` suite stays green

Written and green on firefox. The Cucumber half is unverified: this machine carries no system browser for Selenium to drive, only Playwright's own bundled builds, so `test:cucumber` cannot run here. It has to pass on CT, or on a machine with Firefox installed, before this task is closed.

## 4. Wrap up

- [x] 4.1 Document the spec and the fixture in the `playwright-native` README, and verify the table there lists all five board scenarios and where each runs
- [x] 4.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
- [x] 4.3 Run the whole `playwright-native` suite and verify the new fixture leaves the existing specs, drag and drop included, passing

4.3 ran on firefox: 12 of 12, drag and drop included, which is the other caller of the page object 3.1 touched.
