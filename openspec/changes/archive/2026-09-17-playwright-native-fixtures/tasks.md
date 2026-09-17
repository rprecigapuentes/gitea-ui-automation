## 1. Generalize and relocate PageFactory

- [x] 1.1 Create `business-logic/common/ui/page.factory.ts`: same class, constructor takes `(strategy: IInteractionStrategy, scenarioState: ScenarioState)`, page imports become relative (`./pages/...`)
- [x] 1.2 Delete `services/gitea-selenium-cucumber/features/support/page.factory.ts`
- [x] 1.3 Update `services/gitea-selenium-cucumber/features/support/hooks.ts`: import `PageFactory` from `@gitea-automation/business-logic-common/ui/page.factory`, construct it as `new PageFactory(createSeleniumStrategy(this.driver), scenarioState)`
- [x] 1.4 Update `services/gitea-selenium-cucumber/features/support/world.ts`: import `PageFactory`'s type from the new location
- [x] 1.5 Verify `npm run typecheck --workspaces --if-present` and `npm run lint` green

## 2. Add playwright-native's fixtures

- [x] 2.1 Add `@gitea-automation/business-logic-common`, `@gitea-automation/business-logic-selenium`, `@gitea-automation/core-api-client`, `@gitea-automation/core-page-objects`, `dotenv` to `services/playwright-native/package.json`
- [x] 2.2 Create `services/playwright-native/.env` (gitignored) with the same `GITEA_BASE_URL`/`GITEA_OWNER_*`/`GITEA_TOKEN_*` variables the other two suites use
- [x] 2.3 Write `services/playwright-native/fixtures/credentials.ts` (`resolveOwnerCredentials`, `resolveOwnerToken`), mirroring `gitea-selenium-cucumber/features/support/credentials.ts`
- [x] 2.4 Write `services/playwright-native/fixtures/fixture.ts`: `clients` (7 Gitea clients via `createPlaywrightStrategy` from `core-api-client`, plus `AuthClient`), `strategy` (`createPlaywrightStrategy` from `core-page-objects`, wrapping the built-in `page` fixture), `pages` (`PageFactory`), `scenarioState`
- [x] 2.5 Delete `services/playwright-native/fixtures/pages.fixture.ts` (broken, unused boilerplate)
- [x] 2.6 Wire `dotenv/config` and `baseURL: process.env.GITEA_BASE_URL` into `services/playwright-native/playwright.config.ts`
- [x] 2.7 Verify `npm run typecheck -w @gitea-automation/playwright-native` passes standalone

## 3. Verify with a login-via-API test

- [x] 3.1 Write `services/playwright-native/tests/login-api.spec.ts`: `clients.auth.loginViaApi(username, password)`, inject the returned cookies via `context.addCookies`, navigate, assert logged-in state through Playwright's own `page`/`expect` (not through `pages`, since `PlaywrightInteractionStrategy` is still a stub). Playwright's `addCookies` rejected a cookie carrying both `url` and `path` ("Cookie should have either url or path") — fixed by dropping `path` and letting `url` alone determine domain/path
- [x] 3.2 Ran it against the local Gitea instance on all three browsers: `npm run test:chrome/firefox/edge -w @gitea-automation/playwright-native` — 1/1 passed on each
- [x] 3.3 Verified `npm run typecheck --workspaces --if-present` and `npm run lint` green across the whole repo; re-ran `gitea-selenium-cucumber` chrome — 6/6 scenarios passed (clean, no flake this time), confirming the `PageFactory` relocation caused zero regressions
- [x] 3.4 Archive this change and commit

## 4. Code review fix

- [x] 4.1 Replaced `login-api.spec.ts`'s inline `context.addCookies` call with a `sessionManager` fixture (`loginAs`/`loginAsOwner`/`logout`) — flagged as needing the same shape `gitea-selenium-vitest`'s `sessionManager` fixture already has, where a test says who to log in as rather than handling cookies itself. Added `fixtures/session.util.ts` (`applySession`/`clearSession`), the same cookie dance as `gitea-selenium-vitest`'s `session.util.ts` through `BrowserContext.addCookies`/`clearCookies` instead of `driver.manage()`
- [x] 4.2 `login-api.spec.ts` now logs in and out through `sessionManager` and asserts both the authenticated and the logged-out state
- [x] 4.3 Verified `npm run typecheck --workspaces --if-present` and `npm run lint` green; re-ran the test on all three browsers — 1/1 passed on each
