# @gitea-automation/core

Shared package of the monorepo. Not installed on its own — it's consumed by the services under `services/*` via `npm workspaces` (`"@gitea-automation/core": "*"` in their `package.json`, resolved by npm as a symlink).

## Structure

```
core/
├── api/         # HTTP layer against the Gitea API
│   ├── clients/     # GiteaApiClient base + auth/issue/label/milestone/organizations/repository/user
│   └── entities/     # issue/label/milestone/organization/repository/team/user (API response shapes)
├── ui/          # browser automation layer (built on selenium-webdriver today)
│   ├── base-pages/   # BaseComponent (find/click/type) + BasePage (+URL) + Navigable
│   └── drivers/       # driver.factory.ts — builds/quits a WebDriver, supports a remote grid and BrowserStack
├── config/      # configuration values and credentials
│   ├── gitea.config.ts        # baseUrl, from GITEA_BASE_URL
│   └── browserstack.config.ts # BrowserStack credentials, bstackOptions(), setSessionStatus()
├── utils/       # generic helpers
│   └── test-data.util.ts
└── logger/      # Logger adapter (interface) + Pino implementation
```

## Why this split

Organized by technical layer rather than by domain: `api/` is the HTTP/JSON layer against Gitea, `ui/` is the browser-automation layer, `config/` holds configuration values and credentials, `utils/` and `logger/` are generic. `utils/` and `logger/` know nothing about Gitea or Selenium — any service can use them as-is. `api/` doesn't import `selenium-webdriver` anywhere, so it's reusable regardless of which UI tool a service uses.

## What deliberately does NOT live here

Concrete Gitea page objects (real selectors: `LoginPage`, `IssuePage`, `OrganizationFacade`, fragments, etc.) are not in `core/ui/` — they stay inside each service that uses them (`services/gitea-selenium-vitest/src/ui/pages/**`, and its own equivalent in `services/gitea-selenium-cucumber/features/pages/**`).

Nothing specific to a test runner (Vitest, Cucumber) lives here either: fixtures, hooks, world objects and reporting config are each service's own "internal core".

## A note on `core/ui/` and future tools

`core/ui/base-pages/` and `core/ui/drivers/driver.factory.ts` are built on `selenium-webdriver` today — a future project using a different browser automation tool (e.g. Playwright) can't reuse them as-is, since the underlying APIs (`WebDriver`/`By` vs `Page`/`Locator`) aren't compatible. `core/ui/` isn't namespaced by tool, so when that work starts, distinguishing new files from these (by name, or by introducing a subfolder at that point) is a decision to make then — not resolved in advance.

## Imports

Each subtree is exposed as its own subpath export in `package.json` (`./api/*`, `./ui/*`, `./config/*`, `./utils/*`, `./logger/*`) — there is no `"."` (bare) export. Example from a service:

```ts
import { DriverFactory } from "@gitea-automation/core/ui/drivers/driver.factory";
import { IssueClient } from "@gitea-automation/core/api/clients/issue.client";
import { testDataName } from "@gitea-automation/core/utils/test-data.util";
```
