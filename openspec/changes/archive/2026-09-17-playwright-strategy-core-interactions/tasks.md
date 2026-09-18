## 1. Implement the four core interactions

- [x] 1.1 `PlaywrightElementHandle.click()` — `Locator.click()`
- [x] 1.2 `PlaywrightElementHandle.findElement`/`findElements` — `Locator.locator()` / `Locator.all()`
- [x] 1.3 `PlaywrightInteractionStrategy.findElement`/`findElements`/`click`/`type` — a private `locatorFor(locator, root)` scopes to `root`'s `Locator` when given (via `instanceof PlaywrightElementHandle`), otherwise to `this.page`; `click`/`type` pass `timeoutMs` straight to `Locator.click`/`Locator.fill`
- [x] 1.4 Verify `npm run typecheck -w @gitea-automation/core-page-objects` and `npm run lint` green

## 2. First UI-driven login test

- [x] 2.1 Write `services/playwright-native/tests/login-ui.spec.ts`: navigate to `pages.loginPage.getUrl()`, fill username/password and click submit through the `strategy` fixture directly (not `pages.loginPage.login()`, since that still composes the unimplemented `clickAndWaitForUrl`), confirm via `page.waitForURL`/`expect`
- [x] 2.2 Ran it against the local Gitea instance on all three browsers: `npm run test:chrome/firefox/edge -w @gitea-automation/playwright-native -- login-ui` — 1/1 passed on each; full `test:chrome` (4 specs) also green
- [x] 2.3 Verified `npm run typecheck --workspaces --if-present` and `npm run lint` green across the whole repo
- [x] 2.4 Archive this change and commit

## 3. Code review fix

- [x] 3.1 `PlaywrightElementHandle` and `PlaywrightInteractionStrategy` each reimplemented "scope to a base and build a Locator" separately — flagged as needless duplication between the two classes. Replaced with a shared `locate(base, locator)` function both classes call; the strategy's `base(root)` picks `Page` vs. the root handle's `Locator`, replacing the old private `locatorFor` that duplicated the scoping logic inline
- [x] 3.2 Verified `npm run typecheck -w @gitea-automation/core-page-objects` and `npm run lint` green; re-ran `playwright-native` chrome (4 specs) — all still passing

## 4. Second code review fix — drop the handle class entirely

- [x] 4.1 Still too much ceremony for what `click`/`type` should be: a `PlaywrightElementHandle` class the strategy had to `instanceof`-check just to reach its `Locator`. Replaced with a plain `toElementHandle(locator)` factory function returning an `IElementHandle` object literal — no class. The strategy no longer inspects what `root` is: when given, it just calls `root.findElement`/`root.findElements` (already part of `IElementHandle`) and stays fully polymorphic. `click`/`type` without a `root` — the common case — are now a direct `this.page.locator(locator).click({ timeout: timeoutMs })`/`.fill(...)`, matching Playwright's own docs
- [x] 4.2 Verified `npm run typecheck -w @gitea-automation/core-page-objects` and `npm run lint` green; re-ran `playwright-native` chrome (4 specs) — all still passing

## 5. Third code review round — is IElementHandle itself needed?

- [x] 5.1 Asked whether `IElementHandle` should go entirely, root becoming an opaque value each strategy interprets on its own. Surveyed the real cost first: 21 files under `business-logic/pages/` call `.getText()`/`.getAttribute()`/`.isSelected()`/`.findElement()`/`.findElements()` directly on an element `findElement` already returned (reading several attributes off one already-found row, a heading's own text, a checkbox's checked state, ...) — removing the interface would mean rewriting all 21 to route every such read back through the strategy's own methods. Decision: keep `IElementHandle` (it predates Playwright entirely — it's what let the original Selenium-only strategy decouple from `WebElement` in the first place), but shrink `toElementHandle`'s six not-yet-implemented methods to one-line `Promise.resolve(...)` stubs — no `console.log`, no unused parameters
- [x] 5.2 Verified `npm run typecheck -w @gitea-automation/core-page-objects` and `npm run lint` green; re-ran `playwright-native` chrome (4 specs) — all still passing
