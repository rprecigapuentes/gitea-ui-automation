# gitea-selenium-cucumber

Selenium WebDriver + Cucumber (BDD/Gherkin) automation against Gitea. Part of the `gitea-ui-automation` monorepo.

**Status: scaffold.** One working feature (`login`) proves the wiring end-to-end (driver lifecycle, `@gitea-automation/core`/`@gitea-automation/business-logic` resolution, env loading); the rest of the suite is still to be built.

## What's here

```
services/gitea-selenium-cucumber/
├── cucumber.mjs                        # @cucumber/cucumber config: TS via tsx, step/support glob, feature glob
├── .env.example
└── features/
    ├── login.feature                   # illustrative Gherkin scenario
    ├── step-definitions/login.steps.ts # Given/When/Then for login.feature
    └── support/
        ├── world.ts                    # Cucumber World — holds the WebDriver + page objects for the current scenario
        ├── hooks.ts                    # Before/After (driver lifecycle via @gitea-automation/core's DriverFactory) + setDefaultTimeout
        └── credentials.ts              # resolveOwnerCredentials() — same GITEA_OWNER_<BROWSER>[_PASSWORD] scheme as gitea-selenium-vitest
```

## What it reuses

- `@gitea-automation/core/ui/drivers/driver.factory.ts` — same `DriverFactory` as `gitea-selenium-vitest`, driver lifecycle managed in `features/support/hooks.ts`.
- `@gitea-automation/business-logic/ui/pages/**` — the same concrete page objects as `gitea-selenium-vitest` (`LoginPage`, `MainPage`, and everything else in there). This service keeps no page objects of its own.
- Not used yet, but available when this suite grows: `@gitea-automation/business-logic/api/clients/**` and `.../api/entities/**` for seeding/querying Gitea via its API, exactly like `gitea-selenium-vitest`'s fixtures do.

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

`features/support/hooks.ts` calls `setDefaultTimeout(20000)` — Cucumber's own default step timeout (5000ms) was racing against `BaseComponent.findElement`'s own internal wait (also 5000ms by default), so a step could fail with a generic "function timed out" from Cucumber before the underlying Selenium wait got a chance to report a clearer error.

## Next steps

This is where the suite grows from here — more features, more step definitions, its own seeded-data fixtures via `@gitea-automation/business-logic/api/clients/**`.
