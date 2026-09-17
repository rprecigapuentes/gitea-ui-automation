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
