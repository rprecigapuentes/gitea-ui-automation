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
