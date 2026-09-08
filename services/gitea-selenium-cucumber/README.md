# gitea-selenium-cucumber

Selenium WebDriver + Cucumber (BDD/Gherkin) automation against Gitea. Part of the `gitea-ui-automation` monorepo — see [`docs/PROJECT_CONTEXT.md`](../../docs/PROJECT_CONTEXT.md) at the repo root for the full picture.

**Status: scaffold.** One working feature (`login`) proves the wiring end-to-end (driver lifecycle, `@gitea-automation/core` resolution, env loading); the rest of the suite is still to be built.

## What's here

```
services/gitea-selenium-cucumber/
├── cucumber.mjs                        # @cucumber/cucumber config: TS via tsx, step/support glob, feature glob
├── .env.example
└── features/
    ├── login.feature                   # illustrative Gherkin scenario
    ├── pages/login.page.ts             # this service's OWN LoginPage — not shared with gitea-selenium-vitest, see below
    ├── step-definitions/login.steps.ts # Given/When/Then for login.feature
    └── support/
        ├── world.ts                    # Cucumber World — holds the WebDriver + page objects for the current scenario
        ├── hooks.ts                    # Before/After — driver lifecycle via @gitea-automation/core's DriverFactory
        └── credentials.ts              # resolveOwnerCredentials() — same GITEA_OWNER_<BROWSER>[_PASSWORD] scheme as gitea-selenium-vitest
```

## What it reuses from `@gitea-automation/core`

- `core/selenium/drivers/driver.factory.ts` — same `DriverFactory` as `gitea-selenium-vitest`, driver lifecycle managed in `features/support/hooks.ts`.
- `core/selenium/ui/base-pages/base.page.ts` — `LoginPage` in `features/pages/` extends the same `BasePage`.
- `core/gitea/config.ts` — `baseUrl`.
- Not used yet, but available when this suite grows: `core/gitea/api-clients/**` and `core/gitea/entities/**` for seeding/querying Gitea via its API, exactly like `gitea-selenium-vitest`'s fixtures do.

## What it does NOT reuse (on purpose, for now)

`features/pages/login.page.ts` is this service's **own** page object, not the `LoginPage` from `services/gitea-selenium-vitest`. Concrete Gitea page objects are intentionally per-project today (see [`core/README.md`](../../core/README.md)) — if real duplication builds up between this service and `gitea-selenium-vitest`, promoting shared ones to `core/selenium/gitea/pages/` is a refactor to evaluate then, not something forced now.

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

Needs a `.env` in this folder (copy `.env.example`) with `GITEA_BASE_URL` and, per browser, `GITEA_OWNER_<BROWSER>`/`GITEA_OWNER_<BROWSER>_PASSWORD` (same scheme as `gitea-selenium-vitest`) pointing at a real Gitea instance and account — `features/support/credentials.ts` resolves them by the `BROWSER` env var, same convention as `gitea-selenium-vitest/src/utils/session-credentials.util.ts`.

## Next steps

This is where the suite grows from here — more features, more step definitions, its own credential-resolution helper (mirroring `gitea-selenium-vitest/src/utils/session-credentials.util.ts` if a multi-account/multi-browser scheme turns out to be needed here too), and its own seeded-data fixtures via `@gitea-automation/core/gitea/api-clients/**`.
