# @gitea-automation/core

Shared package of the monorepo. Not installed on its own — it's consumed by the services under `services/*` (and by `@gitea-automation/business-logic`) via `npm workspaces` (`"@gitea-automation/core": "*"` in their `package.json`, resolved by npm as a symlink).

## Structure

```
core/
├── api/         # the one piece of the Gitea API layer that stays here — see below
│   └── gitea-client.client.ts  # abstract GiteaApiClient: got instance, auth header, request/response logging
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

## What moved out (and what stayed)

The concrete Gitea API clients (`auth`/`issue`/`label`/`milestone`/`organizations`/`repository`/`user`) and entities moved to **`@gitea-automation/business-logic`**, alongside the concrete Gitea page objects that used to be duplicated per service. See [`business-logic/README.md`](../business-logic/README.md) for why. The abstract base class they all extend, `GiteaApiClient`, stays here in `core/api/` — it's framework (the shared `got` setup, auth header, logging hooks), not concrete Gitea domain knowledge, so it belongs with the rest of `core`'s framework pieces rather than with the concrete clients in `business-logic`. `core` otherwise holds only what's genuinely tool-and-domain-agnostic (`config`, `utils`, `logger`) plus the Selenium browser-automation primitives (`ui/`).

## What deliberately does NOT live here

Concrete Gitea page objects (real selectors: `LoginPage`, `IssuePage`, `OrganizationFacade`, fragments, etc.) are not in `core/ui/` — they live in `@gitea-automation/business-logic/ui/pages/**` instead, shared by every service that needs them.

Nothing specific to a test runner (Vitest, Cucumber) lives here either: fixtures, hooks, world objects and reporting config are each service's own "internal core".

## A note on `core/ui/` and future tools

`core/ui/base-pages/` and `core/ui/drivers/driver.factory.ts` are built on `selenium-webdriver` today — a future project using a different browser automation tool (e.g. Playwright) can't reuse them as-is, since the underlying APIs (`WebDriver`/`By` vs `Page`/`Locator`) aren't compatible. `core/ui/` isn't namespaced by tool, so when that work starts, distinguishing new files from these (by name, or by introducing a subfolder at that point) is a decision to make then — not resolved in advance.

## Imports

Each subtree is exposed as its own subpath export in `package.json` (`./ui/*`, `./config/*`, `./utils/*`, `./logger/*`, `./api/*`) — there is no `"."` (bare) export. Example:

```ts
import { DriverFactory } from "@gitea-automation/core/ui/drivers/driver.factory";
import { testDataName } from "@gitea-automation/core/utils/test-data.util";
import { GiteaApiClient } from "@gitea-automation/core/api/gitea-client.client";
```
