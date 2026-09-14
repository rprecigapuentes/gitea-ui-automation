## 1. The drag in the core

- [x] 1.1 Add `core/selenium/ui/utils/html5-drag.util.ts`, exporting `simulateHtml5Drag(driver, source, target)`: one `DataTransfer` shared across `pointerdown`, `mousedown`, `dragstart`, `dragenter`, two `dragover`, `drop` and `dragend`, dispatched at the centre of the target and spaced across tasks of the event loop, because a drag library finishes starting the drag on the next task and discards a `dragover` that arrives before it. Verify with `npm run lint` and `npm run typecheck -w @gitea-automation/core-selenium`.
- [ ] 1.2 Add to `core/selenium/ui/base-pages/base-component.ts`: `dragAndDrop(sourceLocator, targetLocator, root?, timeoutMs?)` and `dispatchDragEvents(...)`, both resolving their two locators through `findElement` at call time, the first pressing on the source, moving twice by short offsets to cross the drag threshold, travelling to the target and releasing, the second delegating to the util; and `reload(readyLocators, timeoutMs?)` and `waitUntil(condition, message, timeoutMs?)`, both `protected`, so a page can re-read its screen and wait for a condition without reaching for `driver.navigate()` or `driver.wait`. They land together because a drag that cannot be re-read afterwards cannot be verified. Verify with `npm run typecheck` and `npm run lint`.

## 2. Cards on the board

- [ ] 2.1 Give `business-logic/selenium/ui/pages/projects/fragments/project-column.fragment.ts` the cards container of its column and the cards inside it, keeping the existing title-based and default-based roots untouched: a `getCardsLocator()` for the drop target, `getCardIssueIds()` reading `data-issue` off every card, and an instant `holdsIssueNow()`. Verify with `npm run lint` and by reading each locator once off a board created by hand.
- [ ] 2.2 Add `moveCard(issueId, toColumnTitle)` to `business-logic/selenium/ui/pages/projects/project-board.page.ts`: the pointer gesture, then the board re-read and the card looked for under the target column, then the event sequence and a wait on the re-read board when the first answer is no. Add `getColumnIssueCount(title)` and `getColumnCardIssueIds(title)` delegating to the fragment. No call to the driver anywhere in the file. Verify with `npm run typecheck` and `npm run lint`.

## 3. S2-ISS-01

- [ ] 3.1 Add the scenario to `services/gitea-selenium-cucumber/features/scenarios/project-board.feature` under the existing `@project-board` tag: both seeded issues in the default column, one card dragged onto another column, and the reloaded board asserted on the card's new column, the issue count of both columns and the card left behind.
- [ ] 3.2 Write its steps in `features/step-definitions/project-board.steps.ts`, generalising the existing `addFirstSeededIssueToProject` helper to add a seeded issue by index and adding the drag and the per-column assertions. Verify with `npm run test:cucumber -- --tags @project-board` passing on Chrome and on Firefox, and confirm on Firefox that the run took the fallback.

## 4. Full gate

- [ ] 4.1 Run `npm run format`, `npm run lint`, `npm run typecheck`, `npm run test:cucumber` and `npm test -w @gitea-automation/gitea-selenium-vitest`, and confirm `GET /api/v1/orgs` on the instance holds no organization left by the run.
