## Why

`PlaywrightInteractionStrategy` was fully implemented but never exercised end to end against a real, non-trivial page-object flow beyond login. The condition for this stage: verify it against the Cucumber suite's own drag-and-drop smoke (`project-board.feature`) without touching any existing page object, creating a new one only if genuinely needed. Doing so surfaced two real bugs and one real, permanent browser limitation.

## What Changes

### `core/page-objects/strategies/playwright-interaction.strategy.ts`

- **`isVisible`'s zero-timeout bug (the real blocker).** Several fragments call `isVisible(locator, root, 0)` meaning "check right now, don't wait" (`ProjectColumnFragment.holdsIssueNow`, `isVisibleOnBoardNow`, and the same `INSTANT = 0` pattern in five other fragments/pages). Playwright's own `Locator.waitFor({ timeout: 0 })` means the opposite: no timeout, wait forever. Every one of those "instant" checks was silently hanging until the test's own hard timeout instead of returning `false`, whenever the checked element was genuinely absent. Fixed by special-casing `timeoutMs === 0` to call `Locator.isVisible()` — Playwright's actual immediate, non-waiting check — mirroring the `timeoutMs === 0` special case the Selenium strategy already documents for the same intent.
- **`dragAndDrop`/`dispatchDragEvents` now move the mouse by hand** (`page.mouse.move` with `steps`, then `down`/`up`) instead of `Locator.dragTo()`: confirmed by testing that Gitea's Kanban board only reacts to a real, gradual pointer path, not the native HTML5 `DragEvent`s `dragTo()` dispatches. `dispatchDragEvents` delegates to `dragAndDrop`, same as before — there is still nothing for a second implementation to do differently.
- **Firefox is a confirmed, permanent limitation**, not a bug to keep chasing: neither `Locator.dragTo()`, Playwright's documented manual hover-based drag, nor a stepped `mouse.move()` ever lands a drop on this board under Firefox. All three were tried. A Selenium-style native-`DragEvent`-dispatch fallback was deliberately **not** built — it would reintroduce exactly the complexity this strategy avoids everywhere else, for one browser, on one widget.

### `business-logic/pages/projects/project-board.page.ts`

- **New method, no existing method touched:** `dragCardOnto(issueId, toColumnTitle): Promise<boolean>` — one drag, one reload, one re-read of the board. `moveCard` (native-drag-then-fallback-with-retry-polling) exists for Selenium's needs and stays exactly as it was; Playwright's drag lands in one gesture, so it needs none of that choreography.

### `services/playwright-native/tests/project-board-drag-and-drop.spec.ts` (new)

Replicates `project-board.feature`'s "A card dragged onto another column is kept there by the board": seeds an organization, two repositories and their issues via `clients`, creates a Basic Kanban project and assigns both issues via `pageObjects`, drags the first card into "In Progress" via `dragCardOnto`, and asserts both columns' contents the same way the Cucumber step definitions do. Passes on chrome and edge. Skips firefox with the reason inline (`test.skip(testInfo.project.name === "firefox", ...)`).

### `services/playwright-native/package.json`

Added `@gitea-automation/core-data-handler` as a direct dependency — the new spec imports `testDataName`/`uniqueSuffix` from it, the same way the Cucumber and Vitest suites already do.

## Out of scope

- Investigating whether Firefox's limitation is fixable through some other Playwright mechanism (e.g. CDP-only APIs, which Firefox doesn't expose) — explicitly deferred per instruction not to force a solution here.
- The same `timeoutMs === 0` bug pattern exists in `click` (`specific-team.fragment.ts` passes `click(locator, undefined, 0)` in a Selenium-only retry path) — not fixed here since it is not exercised by anything in this stage's scope, but worth knowing the same category of bug could resurface there if that path is ever exercised by a Playwright test.

## Impact

Modified: `core/page-objects/strategies/playwright-interaction.strategy.ts`, `business-logic/pages/projects/project-board.page.ts` (additive), `services/playwright-native/package.json`. Added: `services/playwright-native/tests/project-board-drag-and-drop.spec.ts`.

## Follow-up: the Firefox limitation was fixable after all

Given explicit permission to try a JavaScript-based workaround, the "confirmed, permanent limitation" above turned out not to be permanent:

- **`dispatchDragEvents` is now a real fallback**, not a delegate to `dragAndDrop`. New file `strategies/playwright-html5-drag.util.ts`'s `simulateHtml5Drag` dispatches the native `pointerdown`/`mousedown`/`dragstart`/`dragenter`/`dragover`×2/`drop`/`dragend` sequence by hand via `page.evaluate` against element handles — the same idea as the Selenium strategy's own `core-selenium/utils/html5-drag.util.ts`, ported to Playwright's evaluate-with-`ElementHandle` mechanism instead of `executeAsyncScript`.
- `ProjectBoardPage.moveCard` (unmodified, still exactly as it was for Selenium) already tries `dragAndDrop` first and only calls `dispatchDragEvents` if the drop didn't reach the server — so once that fallback was real, `moveCard` worked correctly on Playwright with **zero page-object changes needed**.
- `dragCardOnto` (the new method from the first pass) was **removed** — it existed only to isolate the drag from `moveCard`'s retry choreography while diagnosing the failure, and became unnecessary once the real fallback made that choreography work as designed. `project-board.page.ts` ends this stage completely unmodified.
- The spec now calls `pageObjects.projectBoardPage.moveCard(...)` directly, with no `test.skip` for any browser. Confirmed stable across repeated runs (firefox: 3/3; full suite: 2/2, 15/15 each) — chrome/edge also occasionally need the same fallback (a stray timing miss on the primary manual-mouse attempt), and it recovers them just as reliably.

## Follow-up: no try/finally in the test, a real utils location, and tags

Three review comments on the work above:

- **No `try`/`finally` in a test.** The spec's org/repo/issue seeding and cleanup moved out of the test body into a new fixture file, `services/playwright-native/fixtures/hooks-fixtures.ts`: `seededOrganizationWithRepositories` runs its precondition before `use()` and its postcondition after, which Playwright runs even when the test fails — no manual `try`/`finally` needed. This file is meant to hold every future hook the Playwright suites need, the same role `hooks.ts`'s `Before`/`After` blocks play for Cucumber.
- **Tags pair a test with the fixture it needs.** `hooks-fixtures.ts` exports `PROJECT_BOARD_TAG = "@project-board"` (the exact tag `project-board.feature` already carries) right next to the fixture it belongs to. The spec tags its test with it via Playwright's own `test(title, { tag }, body)` API, so `npx playwright test --grep "@project-board"` selects it — the same filtering `cucumber-js --tags "@project-board"` already gives the Selenium suite.
- **`strategies/playwright-html5-drag.util.ts` was misplaced** — sitting directly in `strategies/`, a sibling of the strategy classes, rather than in a `utils/` folder the way `core-selenium/utils/html5-drag.util.ts` is. Moved to `strategies/utils/html5-drag.util.ts`, mirroring `core-selenium`'s own layout for the same kind of file.

`business-logic/pages/projects/project-board.page.ts` is untouched by this follow-up too.
