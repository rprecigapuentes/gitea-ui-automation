# Proposal

## Why

The Playwright framework has to run on the CT pipeline. `services/playwright-native` already exists as a workspace with a `test` script, but nothing runs it: the workflow's matrix names only the two Selenium suites, and its single job is built around a remote Selenium server that the Playwright runner does not use.

## What Changes

- Rename the `regression` job to `selenium`, and add a second job for the Playwright suite. Each carries its own matrix, so `playwright-bdd` joins the second one when it grows a `test` script.
- The Playwright job runs in `mcr.microsoft.com/playwright:v1.63.0-noble`, which carries the bundled browsers and their system libraries, and installs real Chrome and Edge on top. A spike confirmed both launch on that image.
- `actions/setup-node` stays inside the container: the image ships Node 24 while the repo declares `>=22 <23`.
- The suite reads its base URL from `GITEA_BASE_URL`, drives `channel: 'chrome'` and `channel: 'msedge'` so Chrome and Edge are the real products rather than one shared Chromium, and reports through Allure like the Selenium suites.
- `tests/example.spec.ts`, which exercises `playwright.dev`, is replaced by a smoke against the Gitea the job deploys.
- The Playwright job `needs` the Selenium job with `if: always()`: one VPS, one application under test alive at a time, and neither suite's outcome decides the other's.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pipeline`: scopes "A suite reaches the browser through the Selenium server its own job starts" to suites that drive a remote browser, and adds a requirement for suites that drive browsers in their own process. It archives after `ct-drop-healenium`, which introduces the requirement being scoped.

## Impact

- `.gitea/workflows/ct.yml`, `services/playwright-native/` (config, package, tests, `allurerc.js`), `package-lock.json`, and both READMEs.
- `allure` re-resolves from 3.16.0 to 3.17.0 across the monorepo, inside the `^3.16.0` range the Selenium suites already declared, when added to a third workspace. A clean `npm ci` still resolves the plugin and generates. The Selenium suites change in nothing else but the name of the job that runs them.

## Out of Scope

- Page objects and an API client for Playwright: `core/playwright` and `business-logic/playwright` stay empty, so the smoke asserts rendered pages and never logs in.
- The account-seeding block: the smoke needs no Gitea account, so the Playwright job carries none.
- `playwright-bdd`, which exposes no `test` script.
- BrowserStack, WebKit, and merge gating: CT stays scheduled.
