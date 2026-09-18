## 1. Write the verification spec

- [x] 1.1 Read `project-board.feature`'s drag-and-drop scenario and its step definitions to know exactly what to replicate: seed org + 2 repos + 1 issue each, create a Basic Kanban project, assign both issues, drag the first card into "In Progress", assert both columns' contents
- [x] 1.2 Wrote `services/playwright-native/tests/project-board-drag-and-drop.spec.ts` using only existing page objects (`createProjectPage`, `projectListPage`, `issuePage`) and API clients already exposed by the `clients` fixture
- [x] 1.3 Added `@gitea-automation/core-data-handler` to `services/playwright-native/package.json` (already used by the other two suites for the same `testDataName`/`uniqueSuffix` helpers)

## 2. Diagnose the first failure (looked like a Firefox drag bug, wasn't)

- [x] 2.1 First run: chrome/edge passed, firefox hung to the test's own timeout with no useful error
- [x] 2.2 Instrumented with per-step timestamps; found the hang wasn't in the drag gesture at all — it was in `holdsIssueNow`'s `isVisible(locator, undefined, 0)` after a genuinely failed drag
- [x] 2.3 Root-caused: Playwright's `Locator.waitFor({ timeout: 0 })` means "no timeout," not "check now" — the opposite of what every `INSTANT = 0` call site in the page objects intends. Confirmed via a raw, strategy-free reproduction using `page.locator(...).isVisible()` directly, which returned `false` immediately
- [x] 2.4 Fixed `PlaywrightInteractionStrategy.isVisible` to special-case `timeoutMs === 0` into `Locator.isVisible()`, restoring the intended "no wait" behavior across every fragment that relies on it

## 3. Get drag-and-drop actually working

- [x] 3.1 With the hang fixed, chrome/edge kept passing and firefox now failed fast (`false`, not a hang) — a real, isolated result to work from
- [x] 3.2 Replaced `Locator.dragTo()` with Playwright's documented manual-drag recipe (hover source, mouse down, hover target twice, mouse up) — still failed on firefox
- [x] 3.3 Replaced that with a stepped `page.mouse.move(x, y, { steps: 10 })` between bounding-box centers — chrome/edge still pass, firefox still does not land the drop
- [x] 3.4 Confirmed via Playwright's own docs (fetched directly, not from memory) that the manual recipe used in 3.2 is the officially documented one; no further, simpler option exists
- [x] 3.5 Decided not to chase a Selenium-style native-`DragEvent`-dispatch fallback for firefox — tried and discarded during this stage as unnecessary complexity for one browser on one widget, per explicit instruction to keep this simple

## 4. Land it (first pass)

- [x] 4.1 Added `ProjectBoardPage.dragCardOnto(issueId, toColumnTitle)` — new method, `moveCard` and every other existing method untouched
- [x] 4.2 Marked firefox `test.skip` in the new spec with the reason inline, rather than leaving a permanently red or silently-passing-for-the-wrong-reason test
- [x] 4.3 Verified typecheck, lint, and the full `playwright-native` suite (14 passed, 1 skipped) and, as a regression check on the shared page object, the Cucumber `@project-board` suite (unaffected — `dragCardOnto` is additive)

## 5. Follow-up: build the JS fallback, with explicit permission

- [x] 5.1 Given explicit permission to try a JavaScript-based workaround for firefox, wrote `core/page-objects/strategies/playwright-html5-drag.util.ts`'s `simulateHtml5Drag`: dispatches `pointerdown`/`mousedown`/`dragstart`/`dragenter`/`dragover`×2/`drop`/`dragend` by hand via `page.evaluate` against element handles, the same idea as the Selenium strategy's own `simulateHtml5Drag`, ported to Playwright's evaluate-with-`ElementHandle` mechanism
- [x] 5.2 Wired it into `PlaywrightInteractionStrategy.dispatchDragEvents` (previously just a delegate to `dragAndDrop`)
- [x] 5.3 Switched the spec back to the existing, unmodified `ProjectBoardPage.moveCard` (which already tries `dragAndDrop` then falls back to `dispatchDragEvents` on failure) instead of `dragCardOnto` — all three browsers passed
- [x] 5.4 Removed `dragCardOnto` and its `test.skip` for firefox: no longer needed once the fallback was real, so `project-board.page.ts` ends this stage completely unmodified (confirmed via `git diff` against its pre-stage state)
- [x] 5.5 Ran firefox three times and the full suite twice more to confirm stability — 100% pass rate; chrome/edge occasionally need the same fallback too (a stray timing miss on the primary attempt), and it recovers them just as reliably
- [x] 5.6 Re-verified typecheck, lint, and the full `playwright-native` suite (15/15 passed, no skips)

## 6. Follow-up: no try/finally, real hooks fixture, tags, and a proper utils location

- [x] 6.1 Moved `strategies/playwright-html5-drag.util.ts` to `strategies/utils/html5-drag.util.ts`, mirroring `core-selenium/utils/html5-drag.util.ts`'s layout; updated the one import in `playwright-interaction.strategy.ts`
- [x] 6.2 Wrote `services/playwright-native/fixtures/hooks-fixtures.ts`, extending `fixtures/fixture.ts`'s `test`: a `seededOrganizationWithRepositories` fixture runs its setup before `use()` and its teardown after, the same precondition/postcondition the spec's `try`/`finally` used to do by hand
- [x] 6.3 Exported `PROJECT_BOARD_TAG = "@project-board"` from that file, next to the fixture it pairs with — the same tag `project-board.feature` already carries
- [x] 6.4 Tagged the spec's test with it via Playwright's `test(title, { tag }, body)`; confirmed `npx playwright test --grep "@project-board"` selects exactly this test
- [x] 6.5 Removed the `try`/`finally` from `project-board-drag-and-drop.spec.ts` entirely — the test now only calls page objects and asserts
- [x] 6.6 Re-verified typecheck, lint, and the full `playwright-native` suite (15/15 passed) plus the tag filter running the one test in isolation

## 7. Follow-up: put both html5-drag utils in the same folder

- [x] 7.1 Moved `core-selenium/utils/html5-drag.util.ts` into `core-page-objects/strategies/utils/selenium-html5-drag.util.ts` — confirmed via grep that `SeleniumInteractionStrategy` (already in `core-page-objects`) was its only importer anywhere in the repo
- [x] 7.2 Renamed the Playwright one from `utils/html5-drag.util.ts` to `utils/playwright-html5-drag.util.ts` so both tool-specific utils sit side by side in `strategies/utils/` without a name collision, mirroring the `selenium-interaction.strategy.ts`/`playwright-interaction.strategy.ts` naming already used one level up
- [x] 7.3 Updated both strategies' imports to the new local paths; removed the now-empty `core-selenium/utils/` folder and its `"./utils/*"` export entry
- [x] 7.4 Removed `@gitea-automation/core-selenium` from `core-page-objects/package.json` — it was a dependency only for this one file, which no longer lives there; `npm install` cleaned the lockfile accordingly
- [x] 7.5 Updated `core/README.md`, `core/selenium/README.md`, `core/page-objects/README.md` to reflect the move and the dropped dependency
- [x] 7.6 Re-verified typecheck, lint, the full `playwright-native` suite (15/15 passed), and the Cucumber `@project-board` suite as a regression check on `SeleniumInteractionStrategy`'s changed import (exit 0, unaffected)
