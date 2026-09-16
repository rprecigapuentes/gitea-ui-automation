# playwright-native

Scaffolded, runnable workspace for a future UI automation project using Playwright's native test runner (`@playwright/test`), as part of the `gitea-ui-automation` monorepo. No Gitea-specific code yet — just the standard Playwright example.

## What's here

- `playwright.config.ts` and `tests/example.spec.ts` — the default files `npm init playwright@latest` scaffolds. The example test exercises `playwright.dev` itself, not Gitea.
- `chrome`, `firefox` and `edge` project configs, matching the browser matrix the Selenium services already cover. `chrome` and `edge` use `channel` to drive the real installed browsers; `firefox` has no such option in Playwright — it always runs Playwright's own patched Firefox build (downloaded by `playwright install` into `~/AppData/Local/ms-playwright/firefox-*`), never the system's Firefox. Same Gecko engine, different binary — that's why its window shows a different icon than your everyday Firefox when run `:headed`.

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

This project can reuse `@gitea-automation/business-logic-selenium/api/entities/**` (Gitea entities — tool-agnostic; the clients extend `GiteaApiClient` from `core-selenium`, so a Playwright client layer would need its own base, likely in `@gitea-automation/core-playwright`) as a reference. It cannot reuse `@gitea-automation/core-selenium/**` or `@gitea-automation/business-logic-selenium/ui/pages/**` (built on `selenium-webdriver`'s `WebDriver`/`By`, incompatible with Playwright's `Page`/`Locator`). The reserved packages for this are already scaffolded: [`core/playwright`](../../core/playwright/README.md) (empty, sibling of `core/selenium`) and [`business-logic/playwright`](../../business-logic/playwright/README.md) (empty, sibling of `business-logic/selenium`) — that's where this project's driver/base-pages and page objects/clients go when work starts.
