## 1. Background fixture

- [x] 1.1 Add `kanbanProject` to `fixtures/hooks-fixtures.ts`, creating the project from the Basic Kanban template on `seededOrganizationWithRepositories` and handing the test its id and title; verify by having the first ported test read the id and open the board

## 2. Port the four scenarios

- [x] 2.1 Write the board layout and the issue landing in the default column in `tests/project-board.spec.ts`, and verify both pass on firefox with no assertion dropped against `project-board.feature`
- [x] 2.2 Write the column added from the board, and the default column that cannot be deleted and takes in the cards of the deleted one, and verify both pass on firefox
- [x] 2.3 Run the four on chrome, firefox and edge, alone and with `test:parallel`, and verify the run is green on each

Green on firefox locally, 4 of 4. Chrome and edge have no branded build on this machine, so CT run 428 is what covers them: 36 of 36 across the three browsers.

The last scenario asserts two negatives, `columnOffersDelete` false and `boardHidesColumn`, which the fragments check with the instant, non-waiting `isVisible`. That is the divergence `playwright-drag-and-drop-verification` fixed in the strategy, so it is the first place to look if 2.2 hangs instead of failing. Any further point where `PlaywrightInteractionStrategy` turns out to disagree with the Selenium contract gets its own task here, with what was found and why, as `playwright-organization-e2e` and `playwright-issue-e2e` did.

## 3. Let the board page answer for the column it adds

Found while running 2.2, and agreed with the author before touching a page object the Selenium suites share. The column never reached the server: `addColumn` returned as soon as it clicked the modal's save button, with the modal still open and the `POST .../columns/new` in flight, so the navigation that followed aborted it. The test failed on `isColumnVisible("Review")` and then on its own 30 second timeout, with the board holding only the four template columns. Selenium never saw this: a driver round trip is slower than the in-process call that replaced it, so the request had always finished by the time the next step navigated. Measured without reloading, the board renders the column by itself about 500 ms after the click, so the effect is observable where the interaction happened.

- [x] 3.1 `addColumn` waits for the column to be on the board with `clickAndWaitUntil`, the mechanism `moveCard` already uses to answer for the state the server kept; verify the scenario passes on firefox and the Cucumber `@project-board` suite stays green
- [x] 3.2 `makeColumnDefault` and `deleteColumn` wait the same way, for the column being default and for the board no longer showing it; `ProjectColumnFragment` gains `isDefaultNow` because the predicate cannot read text, only answer

Found by CT run 425, where the two menu actions failed the same way on chrome (3 of 3) and edge (1 of 2), and never on firefox: `page.goto: net::ERR_ABORTED`, on the line right after each of them. Gitea answers the confirmation and reloads the board itself, and that reload aborts the navigation the test starts next. Neither `poll` in the Playwright strategy nor `driver.wait` catches, so both predicates are instant visibility checks that answer rather than read.

This machine carries no system browser for Selenium to drive, so `test:cucumber` cannot run here. CT run 428 is the verification for both tasks: selenium and playwright green, 100 percent.

## 4. Keep the board's own seeding in the board's own file

`hooks-fixtures.ts` is named after the Cucumber hooks it replaced, and the author does not want that shape fed further. Moving the whole file is a conversation to have with its author; moving out the fixture written here is not.

- [x] 4.1 `kanbanProject` moves to a new `fixtures/project-board-fixtures.ts` that extends `hooks-fixtures.ts`, and `project-board.spec.ts` imports from it; verify the board specs, the drag-and-drop one included, still pass

## 5. Wrap up

- [x] 5.1 Document the spec and both fixture files in the `playwright-native` README, and verify the table there lists all five board scenarios and where each runs
- [x] 5.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
- [x] 5.3 Run the whole `playwright-native` suite and verify the new fixture leaves the existing specs, drag and drop included, passing

5.3 ran on firefox: 12 of 12, drag and drop included, which is the other caller of the page object section 3 touched. CT run 428 ran all 36 across the three browsers.
