# playwright-native

Scaffolded, runnable workspace for a future UI automation project using Playwright's native test runner (`@playwright/test`), as part of the `gitea-ui-automation` monorepo. No Gitea-specific code yet — just the standard Playwright example.

## What's here

- `playwright.config.ts` and `tests/example.spec.ts` — the default files `npm init playwright@latest` scaffolds. The example test exercises `playwright.dev` itself, not Gitea.
- `chrome`, `firefox` and `edge` project configs, matching the browser matrix the Selenium services already cover — naming and env-var convention only. None of the three sets a `channel`, so all run on Playwright's own managed binaries (whatever `playwright install` downloads into `~/AppData/Local/ms-playwright/`), never a real installed Chrome/Edge/Firefox. That's on purpose: a `channel` (`'chrome'`/`'msedge'`) would need the real browser present on whatever machine runs the tests, which a CI runner isn't guaranteed to have, and would need its own install step beyond plain `playwright install`. It's also why a browser's window shows a different icon than your everyday one when run `:headed` — it's the Playwright-managed copy, not your system's.

## Running it

```bash
npm test -w @gitea-automation/playwright-native
```

runs the example spec on all three browsers in one process. Browser binaries are installed separately (`npx playwright install`), not as part of `npm install`.

For one OS process per browser — the same isolation `gitea-selenium-vitest`/`gitea-selenium-cucumber` use so that two browsers never contend for the same Gitea account:

```bash
npm run test:chrome -w @gitea-automation/playwright-native
npm run test:firefox -w @gitea-automation/playwright-native
npm run test:edge -w @gitea-automation/playwright-native
npm run test:parallel -w @gitea-automation/playwright-native   # the three above, concurrently
```

Each of `test:chrome`/`test:firefox`/`test:edge` sets `BROWSER=<name>` in its process, the same convention `gitea-selenium-vitest`'s `session-credentials.util.ts` reads to pick a browser-specific Gitea account. Nothing here resolves that yet — there is no Gitea test or Playwright client to consume it — but a future one can read `process.env.BROWSER` the same way.

To watch the browsers instead of running headless, add `:headed` (sets `HEADED=1`, which `playwright.config.ts` reads to turn `headless` off):

```bash
npm run test:headed -w @gitea-automation/playwright-native            # all three, one process
npm run test:parallel:headed -w @gitea-automation/playwright-native   # all three, one window each, in parallel
```

or pass `--headed` directly to any single-browser script, e.g. `npm run test:chrome -w @gitea-automation/playwright-native -- --headed`.

## When Gitea-specific work starts here

Unlike when this note was first written, the concrete page objects (`LoginPage`, `IssuePage`, `OrganizationFacade`, every fragment — real Gitea selectors) **are** reusable now: they live in [`@gitea-automation/business-logic-common`](../../business-logic/common/README.md), built on [`@gitea-automation/core-page-objects`](../../core/page-objects/README.md)'s Strategy pattern instead of directly on `selenium-webdriver`. The same `LoginPage` class the Selenium services use would work here too, constructed with `createPlaywrightStrategy(page)` instead of `createSeleniumStrategy(driver)`.

The catch: `PlaywrightInteractionStrategy` (in `core-page-objects`) is currently a stub — every method logs and returns a placeholder, so a page typechecks and runs without throwing, but nothing actually drives a browser yet. Making it real (translating each method to Playwright's `Page`/`Locator` API) is the remaining work before a Gitea test could run here. `@gitea-automation/business-logic-selenium/api/entities/**` is also reusable as-is for any API-side seeding, same as before. `core/playwright` stays reserved for a Playwright driver/context factory (the equivalent of `core-selenium/ui/drivers/driver.factory.ts`) if that ends up separate from wiring a real `Page`/`BrowserContext` into the strategy.
