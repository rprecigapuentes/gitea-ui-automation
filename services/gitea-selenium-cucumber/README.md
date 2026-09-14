# gitea-selenium-cucumber

Selenium WebDriver + Cucumber (BDD/Gherkin) automation against Gitea. Part of the `gitea-ui-automation` monorepo.

**Status: scaffold.** One working feature (`login`) proves the wiring end-to-end (driver lifecycle, World/`ScenarioState`/`PageFactory`, `@gitea-automation/core-selenium`/`@gitea-automation/business-logic-selenium` resolution, env loading); the rest of the suite is still to be built.

## What's here

```
services/gitea-selenium-cucumber/
├── cucumber.mjs                        # @cucumber/cucumber config: TS via tsx, step/support glob, feature glob
├── .env.example
└── features/
    ├── scenarios/login.feature         # illustrative Gherkin scenario — .feature files live here, kept separate from steps/support as the suite grows
    ├── step-definitions/login.steps.ts # Given/When/Then for login.feature
    └── support/
        ├── world.ts                    # Cucumber World — driver, scenarioState (ScenarioState), pages (PageFactory) for the current scenario
        ├── page.factory.ts             # PageFactory — lazy, memoized getters for the page objects a scenario needs (this.pages.loginPage, ...)
        ├── hooks.ts                    # Before/After — driver lifecycle (DriverFactory) + initializes scenarioState/pages + setDefaultTimeout
        └── credentials.ts              # resolveOwnerCredentials() — same GITEA_OWNER_<BROWSER>[_PASSWORD] scheme as gitea-selenium-vitest
```

`cucumber.mjs`'s `paths` glob is `features/**/*.feature`, so any nesting under `features/` (like `scenarios/`) is picked up automatically — no config change needed when adding more `.feature` files or grouping them further.

## Custom World

`GiteaWorld` (`features/support/world.ts`) is Cucumber's per-scenario state container, populated in the `Before` hook (`features/support/hooks.ts`):

- `driver: WebDriver` — from `DriverFactory.getDriver()`, same as `gitea-selenium-vitest`.
- `scenarioState: ScenarioState` — starts as `{}` each scenario, mutated by steps as they create Gitea resources (organization, teams); the same type `gitea-selenium-vitest`'s fixtures use, imported from `@gitea-automation/business-logic-selenium/state/scenario.entity` rather than duplicated.
- `pages: PageFactory` — a `PageFactory` instance (`features/support/page.factory.ts`). Steps never construct a page object directly; they read it off `pages` (`this.pages.loginPage.login(...)`, `this.pages.mainPage.waitUntilLoaded()`). Each page is built lazily on first access and memoized (`??=`) for the rest of the scenario — same pattern this repo already uses for `organizationPages` in `gitea-selenium-vitest`'s fixture. Today it only covers `loginPage`, `mainPage`, `navBar`; adding a page later is one more getter, no changes to `world.ts` or `hooks.ts`.

## Assertions

Step definitions assert with `expect` imported directly from the `vitest` package (`import { expect } from "vitest";`) — same matcher style `gitea-selenium-vitest` already uses (`expect(await page.method()).toBe(...)`). This is `vitest` used purely as an assertion library: there's no `vitest.config.ts` here and Cucumber still runs through `cucumber-js`, not through Vitest's runner. Before this, `login.steps.ts` had no explicit assertion at all — its `Then` step just called `mainPage.waitUntilLoaded()`, which only waits for one locator and throws a generic timeout if it's missing. It's now `expect(await this.pages.mainPage.hasExpectedElementsDisplayed()).toBe(true)`, reusing a method `MainPage` already had (also used by `gitea-selenium-vitest/tests/login.test.ts` for the same check) — waits for the same locator and additionally verifies the expected dashboard elements, with a clear pass/fail instead of a bare timeout.

## What it reuses

- [`@gitea-automation/core-selenium/ui/drivers/driver.factory.ts`](../../core/selenium/README.md) — same `DriverFactory` as `gitea-selenium-vitest`, driver lifecycle managed in `features/support/hooks.ts`.
- [`@gitea-automation/business-logic-selenium/ui/pages/**`](../../business-logic/selenium/README.md) — the same concrete page objects as `gitea-selenium-vitest` (`LoginPage`, `MainPage`, and everything else in there), built through `PageFactory`. This service keeps no page objects of its own.
- [`@gitea-automation/business-logic-selenium/state/scenario.entity.ts`](../../business-logic/selenium/README.md) — `ScenarioState`, the same type `gitea-selenium-vitest` uses to pass Gitea resources created mid-scenario between steps.
- Not used yet, but available when this suite grows: `@gitea-automation/business-logic-selenium/api/clients/**` and `.../api/entities/**` for seeding/querying Gitea via its API, exactly like `gitea-selenium-vitest`'s fixtures do.

## Running

```bash
npm install                                    # from the repo root
npm run test:cucumber                          # from the repo root — default browser (chrome)
npm run test:cucumber:parallel                 # from the repo root — chrome+firefox+edge as 3 concurrent processes
# or, from this folder:
npm test                                       # default browser (chrome)
npm run test:chrome / test:firefox / test:edge # one browser only
npm run test:parallel                          # the three browsers, three concurrent `cucumber-js` processes via concurrently
```

Needs a `.env` in this folder (copy `.env.example`) with `GITEA_BASE_URL` and, per browser, `GITEA_OWNER_<BROWSER>`/`GITEA_OWNER_<BROWSER>_PASSWORD` (same scheme as `gitea-selenium-vitest`, but a separate file — the two services' `.env` don't stay in sync automatically) pointing at a real Gitea instance and account — `features/support/credentials.ts` resolves them by the `BROWSER` env var, same convention as `gitea-selenium-vitest/src/utils/session-credentials.util.ts`.

Also needs `GITEA_ADMIN_TOKEN`, an access token belonging to a Gitea **administrator** of that same instance, with the `write:admin` scope. It is not per-browser: one admin identity is shared, and only the users it creates are browser-unique. `features/support/seeded-users.ts` calls `POST /admin/users` with it in `BeforeAll`, so without it every run dies before its first scenario with `Missing admin API token (GITEA_ADMIN_TOKEN)`.

`features/support/hooks.ts` calls `setDefaultTimeout(20000)` — Cucumber's own default step timeout (5000ms) was racing against `BaseComponent.findElement`'s own internal wait (also 5000ms by default), so a step could fail with a generic "function timed out" from Cucumber before the underlying Selenium wait got a chance to report a clearer error.

## Next steps

This is where the suite grows from here — more features, more step definitions, its own seeded-data fixtures via `@gitea-automation/business-logic-selenium/api/clients/**`.
