# playwright-native

UI automation against Gitea with Playwright's native test runner (`@playwright/test`), as part of the `gitea-ui-automation` monorepo. A smoke suite today: it drives the application under test on real Chrome, Firefox and Edge, and runs nightly on CT alongside the Selenium suites.

## What's here

- `tests/gitea-smoke.spec.ts` — asserts the Gitea at `baseURL` serves its landing page and the sign-up form, on every browser in the matrix. `playwright.config.ts` reads that URL from `GITEA_BASE_URL`, falling back to `http://localhost:3000`, so the suite points at whatever instance you give it. Nothing here logs in; account-level flows wait on the page objects described at the end of this README.
- `allurerc.js` and the `allure-playwright` reporter, the same Allure 3 setup the Selenium suites use. `npm run report` turns `allure-results/` into a single-file `allure-report/index.html`, and each result carries the project it ran on, so a failure names its browser without opening the job log.
- `chrome`, `firefox` and `edge` project configs, matching the browser matrix the Selenium services already cover. `chrome` and `edge` set `channel: 'chrome'` and `channel: 'msedge'`, so each drives the real product. Without a channel, `Desktop Chrome` and `Desktop Edge` both resolve to Playwright's bundled Chromium, and two of the three results would be the same engine under different names. Firefox needs no channel: the bundled build is Firefox. The branded browsers are a separate install (`npx playwright install chrome msedge`); on CT the job runs inside `mcr.microsoft.com/playwright`, which already carries the bundled ones and their system libraries, and adds those two on top.

## Custom fixtures

`fixtures/fixture.ts` extends `@playwright/test`'s own `test` with five fixtures:

- `strategy: IInteractionStrategy` — Playwright's own `page` fixture wrapped with `InteractionStrategyFactory.playwright` from [`@gitea-automation/core-page-objects`](../../core/page-objects/README.md).
- `clients` — the 7 Gitea API clients (`organizations`, `repositories`, `issues`, `labels`, `teams`, `milestones`, `users`), each built via `RequestStrategyFactory.playwright` from [`@gitea-automation/core-api-client`](../../core/api-client/README.md), sharing one `PlaywrightRequestStrategy` instance — plus `auth: AuthClient`, which stays `got`-based (see that package's README for why it's out of the Strategy pattern).
- `pageObjects: PageFactory` — [`@gitea-automation/business-logic/pages/page.factory.ts`](../../business-logic/README.md), built from `strategy` and `scenarioState`.
- `scenarioState: ScenarioState` — starts as `{}` per test, same type the other two suites use.
- `sessionManager` — `loginAs(username, password)`, `loginAsOwner()`, `logout()`. A test says who to log in as, not how — the same shape as `gitea-selenium-vitest`'s `sessionManager` fixture. Underneath, `fixtures/session.util.ts`'s `applySession`/`clearSession` do the same cookie dance `gitea-selenium-vitest`'s `session.util.ts` does for a `WebDriver` (`AuthClient.loginViaApi` → clear cookies → set the returned ones → reload), just through `BrowserContext.addCookies`/`clearCookies` instead of `driver.manage()`.

```ts
import { test, expect } from "../fixtures/fixture";

test("...", async ({ sessionManager, pageObjects, scenarioState }) => {
  await sessionManager.loginAsOwner();
});
```

## Running it

```bash
npm test -w @gitea-automation/playwright-native
```

runs every spec (`gitea-smoke.spec.ts`, `login-api.spec.ts`, `login-ui.spec.ts`) on all three browsers in one process. Browser binaries are installed separately, not as part of `npm install`:

```bash
npx playwright install firefox        # the bundled build
npx playwright install chrome msedge  # the real products the branded projects drive
```

Point the suite somewhere with `GITEA_BASE_URL`, for example `GITEA_BASE_URL=http://localhost:3000 npm test -w @gitea-automation/playwright-native`.

For one OS process per browser — the same isolation `gitea-selenium-vitest`/`gitea-selenium-cucumber` use so that two browsers never contend for the same Gitea account:

```bash
npm run test:chrome -w @gitea-automation/playwright-native
npm run test:firefox -w @gitea-automation/playwright-native
npm run test:edge -w @gitea-automation/playwright-native
npm run test:parallel -w @gitea-automation/playwright-native   # the three above, concurrently
```

`fixtures/credentials.ts`'s `resolveOwnerCredentials`/`resolveOwnerToken` pick a browser-specific Gitea account, but not from an env var: `npm test` runs all three projects in one worker process, where an env var can't vary per project. They take the project name as a parameter instead, sourced from Playwright's own `testInfo.project.name` — the same convention whether a test runs standalone (`test:chrome`), as part of `test:parallel`, or all three together via plain `npm test`.

To watch the browsers instead of running headless, add `:headed` (sets `HEADED=1`, which `playwright.config.ts` reads to turn `headless` off):

```bash
npm run test:headed -w @gitea-automation/playwright-native            # all three, one process
npm run test:parallel:headed -w @gitea-automation/playwright-native   # all three, one window each, in parallel
```

or pass `--headed` directly to any single-browser script, e.g. `npm run test:chrome -w @gitea-automation/playwright-native -- --headed`.

## Current limitation: UI tests

`login-api.spec.ts` proves the `clients` fixture end to end (`PlaywrightRequestStrategy`, real HTTP against the local Gitea instance) and drives real browser state via `context.addCookies` — but it asserts through Playwright's own `page`/`expect`, not through `pageObjects`.

`login-ui.spec.ts` drives a real login the same way the Selenium suites do: `pageObjects.loginPage.open()`/`.login(...)`, asserted through `pageObjects.mainPage.hasExpectedElementsDisplayed()`/`navBar.getCurrentOrganization()`. That needed `open`, `clickAndWaitForUrl`, `isVisible`, `getText`, and `getAttribute` real on top of `findElement`/`findElements`/`click`/`type` — every one of `PlaywrightInteractionStrategy`'s methods this login flow touches is real now. Everything else on `IInteractionStrategy` (`clearAndType`, drag-and-drop, the remaining `*AndWait*` compositions, `waitFor`/`waitForUrl` as standalone calls, `executeScript`) is still a stub.
