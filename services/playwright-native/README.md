# playwright-native

UI automation against Gitea with Playwright's native test runner (`@playwright/test`), as part of the `gitea-ui-automation` monorepo. A smoke suite today: it drives the application under test on real Chrome, Firefox and Edge, and runs nightly on CT alongside the Selenium suites.

## What's here

- `tests/gitea-smoke.spec.ts` — asserts the Gitea at `baseURL` serves its landing page and the sign-up form, on every browser in the matrix. `playwright.config.ts` reads that URL from `GITEA_BASE_URL`, falling back to `http://localhost:3000`, so the suite points at whatever instance you give it. Nothing here logs in; account-level flows wait on the page objects described at the end of this README.
- `allurerc.js` and the `allure-playwright` reporter, the same Allure 3 setup the Selenium suites use. `npm run report` turns `allure-results/` into a single-file `allure-report/index.html`, and each result carries the project it ran on, so a failure names its browser without opening the job log.
- `chrome`, `firefox` and `edge` project configs, matching the browser matrix the Selenium services already cover. `chrome` and `edge` set `channel: 'chrome'` and `channel: 'msedge'`, so each drives the real product. Without a channel, `Desktop Chrome` and `Desktop Edge` both resolve to Playwright's bundled Chromium, and two of the three results would be the same engine under different names. Firefox needs no channel: the bundled build is Firefox. The branded browsers are a separate install (`npx playwright install chrome msedge`); on CT the job runs inside `mcr.microsoft.com/playwright`, which already carries the bundled ones and their system libraries, and adds those two on top.

## Running it

```bash
npm test -w @gitea-automation/playwright-native
```

runs the smoke on all three browsers in one process. Browser binaries are installed separately, not as part of `npm install`:

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

Each of `test:chrome`/`test:firefox`/`test:edge` sets `BROWSER=<name>` in its process, the same convention `gitea-selenium-vitest`'s `session-credentials.util.ts` reads to pick a browser-specific Gitea account. Nothing here resolves that yet — there is no Gitea test or Playwright client to consume it — but a future one can read `process.env.BROWSER` the same way.

To watch the browsers instead of running headless, add `:headed` (sets `HEADED=1`, which `playwright.config.ts` reads to turn `headless` off):

```bash
npm run test:headed -w @gitea-automation/playwright-native            # all three, one process
npm run test:parallel:headed -w @gitea-automation/playwright-native   # all three, one window each, in parallel
```

or pass `--headed` directly to any single-browser script, e.g. `npm run test:chrome -w @gitea-automation/playwright-native -- --headed`.

## When page objects start here

This project can reuse `@gitea-automation/business-logic-selenium/api/entities/**` (Gitea entities — tool-agnostic; the clients extend `GiteaApiClient` from `core-selenium`, so a Playwright client layer would need its own base, likely in `@gitea-automation/core-playwright`) as a reference. It cannot reuse `@gitea-automation/core-selenium/**` or `@gitea-automation/business-logic-selenium/ui/pages/**` (built on `selenium-webdriver`'s `WebDriver`/`By`, incompatible with Playwright's `Page`/`Locator`). The reserved packages for this are already scaffolded: [`core/playwright`](../../core/playwright/README.md) (empty, sibling of `core/selenium`) and [`business-logic/playwright`](../../business-logic/playwright/README.md) (empty, sibling of `business-logic/selenium`) — that's where this project's driver/base-pages and page objects/clients go when work starts.
