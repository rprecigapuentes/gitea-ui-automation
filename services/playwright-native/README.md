# playwright-native

UI and API automation against Gitea using Playwright's native test runner (`@playwright/test`), as part of the `gitea-ui-automation` monorepo, sharing the same abstractions the Selenium services use.

## What's here

```
services/playwright-native/
├── playwright.config.ts          # dotenv, baseURL, chrome/firefox/edge projects, HEADED toggle
├── .env                          # gitignored — GITEA_BASE_URL, GITEA_OWNER_<BROWSER>[_PASSWORD], GITEA_TOKEN_<BROWSER>
├── fixtures/
│   ├── credentials.ts            # resolveOwnerCredentials()/resolveOwnerToken() — same scheme as gitea-selenium-cucumber
│   ├── session.util.ts           # applySession()/clearSession() — cookie-based API login, same shape as gitea-selenium-vitest's session.util.ts
│   └── fixture.ts                # custom test fixtures: strategy, clients, pages, scenarioState, sessionManager
└── tests/
    ├── example.spec.ts           # the default file npm init playwright@latest scaffolds, exercises playwright.dev itself
    └── login-api.spec.ts         # Gitea-specific: logs in and out via sessionManager, cookie-based, no UI
```

- `chrome`, `firefox` and `edge` project configs, matching the browser matrix the Selenium services already cover — naming and env-var convention only. None of the three sets a `channel`, so all run on Playwright's own managed binaries (whatever `playwright install` downloads into `~/AppData/Local/ms-playwright/`), never a real installed Chrome/Edge/Firefox. That's on purpose: a `channel` (`'chrome'`/`'msedge'`) would need the real browser present on whatever machine runs the tests, which a CI runner isn't guaranteed to have, and would need its own install step beyond plain `playwright install`. It's also why a browser's window shows a different icon than your everyday one when run `:headed` — it's the Playwright-managed copy, not your system's.

## Custom fixtures

`fixtures/fixture.ts` extends `@playwright/test`'s own `test` with five fixtures:

- `strategy: IInteractionStrategy` — Playwright's own `page` fixture wrapped with `InteractionStrategyFactory.playwright` from [`@gitea-automation/core-page-objects`](../../core/page-objects/README.md).
- `clients` — the 7 Gitea API clients (`organizations`, `repositories`, `issues`, `labels`, `teams`, `milestones`, `users`), each built via `RequestStrategyFactory.playwright` from [`@gitea-automation/core-api-client`](../../core/api-client/README.md), sharing one `PlaywrightRequestStrategy` instance — plus `auth: AuthClient`, which stays `got`-based (see that package's README for why it's out of the Strategy pattern).
- `pages: PageFactory` — [`@gitea-automation/business-logic/pages/page.factory.ts`](../../business-logic/README.md), built from `strategy` and `scenarioState`.
- `scenarioState: ScenarioState` — starts as `{}` per test, same type the other two suites use.
- `sessionManager` — `loginAs(username, password)`, `loginAsOwner()`, `logout()`. A test says who to log in as, not how — the same shape as `gitea-selenium-vitest`'s `sessionManager` fixture. Underneath, `fixtures/session.util.ts`'s `applySession`/`clearSession` do the same cookie dance `gitea-selenium-vitest`'s `session.util.ts` does for a `WebDriver` (`AuthClient.loginViaApi` → clear cookies → set the returned ones → reload), just through `BrowserContext.addCookies`/`clearCookies` instead of `driver.manage()`.

```ts
import { test, expect } from "../fixtures/fixture";

test("...", async ({ sessionManager, pages, scenarioState }) => {
  await sessionManager.loginAsOwner();
});
```

## Running it

```bash
npm test -w @gitea-automation/playwright-native
```

runs every spec (`example.spec.ts` and `login-api.spec.ts`) on all three browsers in one process. Browser binaries are installed separately (`npx playwright install`), not as part of `npm install`.

For one OS process per browser — the same isolation `gitea-selenium-vitest`/`gitea-selenium-cucumber` use so that two browsers never contend for the same Gitea account:

```bash
npm run test:chrome -w @gitea-automation/playwright-native
npm run test:firefox -w @gitea-automation/playwright-native
npm run test:edge -w @gitea-automation/playwright-native
npm run test:parallel -w @gitea-automation/playwright-native   # the three above, concurrently
```

Each of `test:chrome`/`test:firefox`/`test:edge` sets `BROWSER=<name>` in its process, the same convention `gitea-selenium-cucumber`'s `credentials.ts` reads to pick a browser-specific Gitea account — `fixtures/credentials.ts` here does exactly the same thing.

To watch the browsers instead of running headless, add `:headed` (sets `HEADED=1`, which `playwright.config.ts` reads to turn `headless` off):

```bash
npm run test:headed -w @gitea-automation/playwright-native            # all three, one process
npm run test:parallel:headed -w @gitea-automation/playwright-native   # all three, one window each, in parallel
```

or pass `--headed` directly to any single-browser script, e.g. `npm run test:chrome -w @gitea-automation/playwright-native -- --headed`.

## Current limitation: UI tests

`login-api.spec.ts` proves the `clients` fixture end to end (`PlaywrightRequestStrategy`, real HTTP against the local Gitea instance) and drives real browser state via `context.addCookies` — but it asserts through Playwright's own `page`/`expect`, not through `pages`.

That's because `PlaywrightInteractionStrategy` (in `core-page-objects`) is still a stub — every method logs and returns a placeholder, so `pages.loginPage`/`pages.mainPage`/any page typechecks and constructs fine, but nothing actually drives the browser yet. `strategy` and `pages` are wired and ready; a UI-driven test (filling the login form through `pages.loginPage.login(...)`, asserting through `pages.mainPage.hasExpectedElementsDisplayed()`) needs that strategy implemented for real first — translating each method to Playwright's `Page`/`Locator` API.
