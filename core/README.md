# @gitea-automation/core

Shared package of the monorepo. Not installed on its own — it's consumed by the services under `services/*` via `npm workspaces` (`"@gitea-automation/core": "*"` in their `package.json`, resolved by npm as a symlink).

## Structure

```
core/
├── logging/     # Logger adapter + Pino implementation — 100% agnostic of the app and of the UI tool
├── utils/       # test-data.util: test-data naming (AT-<caseId>-<object>-<date>-<time>-<browser>-<suffix>) — 100% agnostic
├── gitea/       # Gitea domain: API clients (got) + entities — agnostic of the UI tool (Selenium/Playwright/whatever)
│   ├── config.ts
│   ├── api-clients/
│   └── entities/
└── selenium/    # everything coupled to selenium-webdriver: driver factory, base pages, BrowserStack (WebDriver)
    ├── drivers/
    ├── config/
    └── ui/base-pages/
```

## Why this split

- **`logging/` and `utils/`** know nothing about Gitea or Selenium — any service in the monorepo can use them as-is.
- **`gitea/`** is pure HTTP/JSON (via `got`) against the Gitea API. It doesn't import `selenium-webdriver` anywhere. It's domain of the application under test, not of the automation tool — that's why `gitea-selenium-vitest`, `gitea-selenium-cucumber`, and in the future a Playwright project, can all reuse it without pulling in Selenium as a dependency if they don't need it.
- **`selenium/`** is the opposite: `selenium-webdriver` mechanics (`WebDriver`, `By`, `until`), knowing nothing about Gitea. Today it's consumed by two real services (`gitea-selenium-vitest` and `gitea-selenium-cucumber`).

## What deliberately does NOT live here

Concrete Gitea page objects (real selectors: `LoginPage`, `IssuePage`, `OrganizationFacade`, fragments, etc.) are not in `core/selenium/` — they stay inside each service that uses them (`services/gitea-selenium-vitest/src/ui/pages/**`, and its own equivalent in `services/gitea-selenium-cucumber/features/pages/**`). The long-term idea is for `core` to hold the base pages (it already does) and each project its own concrete pages; if real duplication ever builds up between two Selenium services, promoting shared ones to a `core/selenium/gitea/pages/` is a separate refactor to evaluate then, not something forced now.

Nothing specific to a test runner (Vitest, Cucumber) lives here either: fixtures, hooks, world objects and reporting config are each service's own "internal core".

## The seam for a future Playwright project

`services/playwright-native/` and `services/playwright-bdd/` exist today as empty workspaces. When real work starts on either, the pattern to follow is adding a **`core/playwright/`** parallel to `core/selenium/` (with its own `drivers/`, `config/`, and a base page/component built on Playwright's `Page`/`Locator` instead of `WebDriver`/`By`), without touching `core/selenium/**`. `core/gitea/` doesn't change — the Gitea domain (API clients + entities) is just as valid for a Playwright project.

## Imports

Each subtree is exposed as its own subpath export in `package.json` (`./logging/*`, `./utils/*`, `./gitea/*`, `./selenium/*`) — there is no `"."` (bare) export on purpose, to force every import to explicitly declare whether it touches `gitea` or `selenium`. Example from a service:

```ts
import { DriverFactory } from "@gitea-automation/core/selenium/drivers/driver.factory";
import { IssueClient } from "@gitea-automation/core/gitea/api-clients/issue.client";
import { testDataName } from "@gitea-automation/core/utils/test-data.util";
```
