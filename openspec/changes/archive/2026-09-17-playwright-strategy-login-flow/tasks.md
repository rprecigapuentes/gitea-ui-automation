## 1. Implement the methods the full login flow needs

- [x] 1.1 `toElementHandle`'s `getText`/`getAttribute` — real (`Locator.textContent()`/`Locator.getAttribute()`), needed for the root-scoped reads in `MainPage.hasExpectedElementsDisplayed()`
- [x] 1.2 `PlaywrightInteractionStrategy.getText`/`getAttribute` — page-rooted path uses `Locator.textContent`/`Locator.getAttribute` directly; root-scoped path delegates to `root.findElement(locator)` then the handle's own method
- [x] 1.3 `PlaywrightInteractionStrategy.isVisible` — `Locator.waitFor({ state: "visible", timeout })` per locator, `.catch(() => false)`, AND across the list
- [x] 1.4 `PlaywrightInteractionStrategy.clickAndWaitForUrl` — `Promise.all([page.waitForURL(pattern, { timeout }), this.click(...)])`
- [x] 1.5 `PlaywrightInteractionStrategy.open` — `page.goto(url)` then `Promise.all(readyLocators.map((l) => page.locator(l).waitFor({ timeout })))`
- [x] 1.6 Verify `npm run typecheck -w @gitea-automation/core-page-objects` and `npm run lint` green

## 2. Fix the locator bug this surfaced and verify the login-ui test

- [x] 2.1 Ran the test, found it hanging on `organizationOption` — traced it to a redundant `#dashboard-repo-list` prefix already baked into that locator, unlike the correctly-relative `repositoryOption`. Selenium's relative CSS lookup tolerates the redundant self-reference; Playwright's `Locator.locator()` chaining does not. Removed the redundant prefix in `business-logic/pages/common/main.page.ts`
- [x] 2.2 Ran `login-ui.spec.ts` on all three browsers — 1/1 passed on each; full `playwright-native` `test:chrome` (4 specs) also green
- [x] 2.3 Verified zero regression on the Selenium side: `gitea-selenium-vitest` `login.test.ts` (exercises the same `hasExpectedElementsDisplayed()` path) passed; full `test:chrome` 3/4 (the one failure is the pre-existing `#issue-label-edit-modal` flake, unrelated); `gitea-selenium-cucumber` chrome 4/6 (the two failures are the pre-existing team-management UI-timing flake, unrelated — neither scenario touches the dashboard tabs)
- [x] 2.4 Archive this change and commit
