# gitea-selenium-cucumber

Selenium WebDriver + Cucumber (BDD/Gherkin) automation against Gitea. Part of the `gitea-ui-automation` monorepo.

Three features so far: `login`, `organizations` (org/team/repository creation and assignment, both `@e2e` and `@smoke`), `project-board` (Kanban board over an org's issues). All drive the same shared page objects/API clients from `@gitea-automation/business-logic-selenium`.

## What's here

```
services/gitea-selenium-cucumber/
├── cucumber.mjs                            # @cucumber/cucumber config: TS via tsx, step/support glob, feature glob, tags from CUCUMBER_TAGS
├── .env.example
└── features/
    ├── scenarios/                          # login.feature, organizations.feature, project-board.feature
    ├── step-definitions/                   # one .steps.ts per feature, same base name
    └── support/
        ├── world.ts                        # Cucumber World — driver, scenarioState (ScenarioState), pages (PageFactory) for the current scenario
        ├── page.factory.ts                 # PageFactory — lazy, memoized getters for the page objects a scenario needs (this.pages.loginPage, ...)
        ├── hooks.ts                        # Before/After (some tag-scoped) — driver lifecycle, API-side seeding, scenarioState/pages init, cleanup, setDefaultTimeout
        ├── credentials.ts                  # resolveOwnerCredentials()/resolveOwnerToken() — same GITEA_OWNER_<BROWSER>[_PASSWORD]/GITEA_TOKEN_<BROWSER> scheme as gitea-selenium-vitest
        └── seeded-users.ts                 # getSeededUser(index) — 2 users provisioned per browser process via BeforeAll/AfterAll, for steps that need an existing user without creating one inline
```

`cucumber.mjs`'s `paths` glob is `features/**/*.feature`, so any nesting under `features/` (like `scenarios/`) is picked up automatically — no config change needed when adding more `.feature` files or grouping them further.

## Tags

- `@smoke` / `@e2e` — scope, not mutually exclusive with the others below. Run one or the other with `--tags "@smoke"` / `--tags "@e2e"`, or scope any `npm run test*` script the same way via `CUCUMBER_TAGS` (`cucumber.mjs` reads it straight into its own `tags` field).
- `@cleanup` — set at the `Feature:` level; its `After` hook (`hooks.ts`) deletes `scenarioState.organization` (and any repositories tracked on it or on `scenarioState.repositories`) once the scenario ends, pass or fail. A feature that creates an organization should carry this tag.
- `@project-board`, `@team-repository` — tag-scoped `Before` hooks that seed an organization (plus, depending on the tag, repositories/issues or a team+repository) purely through the API clients, before the scenario's own steps run. This is the pattern to follow for any `@smoke` scenario that wants to start mid-flow instead of building its fixture through the UI: add a tag, seed it in `hooks.ts`, keep the scenario itself to the one action under test.

## Custom World

`GiteaWorld` (`features/support/world.ts`) is Cucumber's per-scenario state container, populated in the `Before` hook (`features/support/hooks.ts`):

- `driver: WebDriver` — from `DriverFactory.getDriver()`, same as `gitea-selenium-vitest`.
- `scenarioState: ScenarioState` — starts as `{}` each scenario, mutated by steps as they create Gitea resources (organization, teams); the same type `gitea-selenium-vitest`'s fixtures use, imported from `@gitea-automation/business-logic-selenium/state/scenario.entity` rather than duplicated.
- `pages: PageFactory` — a `PageFactory` instance (`features/support/page.factory.ts`). Steps never construct a page object directly; they read it off `pages` (`this.pages.loginPage.login(...)`, `this.pages.mainPage.waitUntilLoaded()`). Each page is built lazily on first access and memoized (`??=`) for the rest of the scenario — same pattern this repo already uses for `organizationPages` in `gitea-selenium-vitest`'s fixture. It also exposes `orgFacade`, an `OrganizationFacade` composing the organization fragments (repositories, teams, specific team, ...), resolving the organization lazily from `scenarioState.organization`. Adding a page or fragment later is one more getter, no changes to `world.ts` or `hooks.ts`.

## Assertions

Step definitions assert with `expect` imported directly from the `vitest` package (`import { expect } from "vitest";`) — same matcher style `gitea-selenium-vitest` already uses (`expect(await page.method()).toBe(...)`). This is `vitest` used purely as an assertion library: there's no `vitest.config.ts` here and Cucumber still runs through `cucumber-js`, not through Vitest's runner. Before this, `login.steps.ts` had no explicit assertion at all — its `Then` step just called `mainPage.waitUntilLoaded()`, which only waits for one locator and throws a generic timeout if it's missing. It's now `expect(await this.pages.mainPage.hasExpectedElementsDisplayed()).toBe(true)`, reusing a method `MainPage` already had (also used by `gitea-selenium-vitest/tests/login.test.ts` for the same check) — waits for the same locator and additionally verifies the expected dashboard elements, with a clear pass/fail instead of a bare timeout.

## What it reuses

- [`@gitea-automation/core-selenium/ui/drivers/driver.factory.ts`](../../core/selenium/README.md) — same `DriverFactory` as `gitea-selenium-vitest`, driver lifecycle managed in `features/support/hooks.ts`.
- [`@gitea-automation/business-logic-selenium/ui/pages/**`](../../business-logic/selenium/README.md) — the same concrete page objects as `gitea-selenium-vitest` (`LoginPage`, `MainPage`, and everything else in there), built through `PageFactory`. This service keeps no page objects of its own.
- [`@gitea-automation/business-logic-selenium/state/scenario.entity.ts`](../../business-logic/selenium/README.md) — `ScenarioState`, the same type `gitea-selenium-vitest` uses to pass Gitea resources created mid-scenario between steps.
- [`@gitea-automation/business-logic-selenium/api/clients/**`](../../business-logic/selenium/README.md) — `OrganizationClient`, `RepositoryClient`, `TeamClient`, `IssueClient`, used both in tag-scoped `hooks.ts` seeding and directly in `Given` steps (e.g. `"an organization already exists"`), exactly like `gitea-selenium-vitest`'s fixtures do.

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

More features, more step definitions, more API-seeded `@smoke` scenarios following the `@project-board`/`@team-repository` hook pattern.
