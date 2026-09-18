## 1. Direct native-Playwright mappings

- [x] 1.1 Simplified `clearAndType` to a single `Locator.fill()` call
- [x] 1.2 `dragAndDrop` (`Locator.dragTo()`) and `dispatchDragEvents` (delegates to `dragAndDrop` — no Playwright-side reason for the two to differ)
- [x] 1.3 `getCurrentUrl` (`page.url()`), `reload` (`page.reload()` + `Locator.waitFor()` per ready locator), `queryAll` (`Locator.all()`), `waitForUrl` (`page.waitForURL()`), `executeScript` (`page.evaluate(script, args[0])` — every real call site passes exactly one arg)
- [x] 1.4 `IElementHandle.isSelected`/`isDisplayed`/`clear`/`sendKeys` (`Locator.isChecked`/`isVisible`/`clear`/`fill`) — confirmed these are called directly on handles by real page objects (`checkbox.isSelected()`, `input.clear()`/`sendKeys()`)
- [x] 1.5 Verified `npm run typecheck -w @gitea-automation/core-page-objects` and lint green

## 2. Predicate-based waits

- [x] 2.1 `waitFor`, `waitUntil`, `actAndWaitUntil` via `expect.poll(predicate, { timeout, message })` — Playwright's own documented tool for an arbitrary async wait condition; `waitUntil` converts a timeout into `false` instead of throwing, via `.catch()`, matching its "never throws" contract
- [x] 2.2 `clickAndWaitUntil` composes `click` + `actAndWaitUntil`
- [x] 2.3 Verified typecheck/lint green

## 3. Locator-list waits

- [x] 3.1 `actAndWaitFor`: runs the action, then `Locator.waitFor()`s each ready locator (or delegates to `root.findElement` when scoped) before wrapping as a handle
- [x] 3.2 `clickAndWaitFor`/`typeAndWaitFor` compose `click`/`type` + `actAndWaitFor`
- [x] 3.3 Verified typecheck/lint green

## 4. Verify

- [x] 4.1 Ran the full `playwright-native` suite (all three browsers, one worker process — matching how CI invokes it) — 12/12 passed, zero regressions
- [x] 4.2 Confirmed no `console.log` stub or `try`/`catch` block remains anywhere in the file
