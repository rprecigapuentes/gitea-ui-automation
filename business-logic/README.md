# @gitea-automation/business-logic

Shared package of the monorepo, like `@gitea-automation/core` — not installed on its own, consumed by `services/*` via `npm workspaces`.

**Proposed change to the earlier per-project approach:** the original migration deliberately kept concrete Gitea page objects and API clients/entities local to each service (`gitea-selenium-vitest` had its own `src/ui/pages/**`, `gitea-selenium-cucumber` had its own duplicate `LoginPage`/`MainPage`). This package reverses that: since both `gitea-selenium-vitest` and `gitea-selenium-cucumber` test the same Gitea instance with the same tool (Selenium), their concrete page objects and API layer are now shared here instead of duplicated.

## Structure

```
business-logic/
├── ui/
│   └── pages/    # concrete Gitea page objects — Page/Fragment/Facade, by feature (authentication/, common/, issues/, organizations/)
└── api/
    ├── clients/   # auth/issue/label/milestone/organizations/repository/user — extend GiteaApiClient from core/api/
    └── entities/   # issue/label/milestone/organization/repository/team/user (API response shapes)
```

The abstract `GiteaApiClient` base that `clients/**` (except `auth.client.ts`, which is standalone) extends lives in `@gitea-automation/core/api/gitea-client.client` — it's shared `got` setup/framework, not concrete Gitea domain knowledge, so it stays with `core`. Only the concrete clients (real Gitea endpoints) and entities (real Gitea response shapes) are here.

## Relationship to `@gitea-automation/core`

`business-logic` depends on `core`: `ui/pages/**` builds on `core/ui/base-pages/**` (`BaseComponent`/`BasePage`) and reads `core/config/gitea.config` for `baseUrl`; `api/clients/**` extends `core/api/gitea-client.client` (`GiteaApiClient`). `core` stays the tool-and-domain-agnostic foundation (driver factory, base pages, config, logging, generic utils, the API client framework); `business-logic` is the concrete Gitea application knowledge built on top of it — page objects with real selectors, and the REST clients/entities for Gitea's actual endpoints.

## Who uses this

`services/gitea-selenium-vitest` and `services/gitea-selenium-cucumber` both depend on `@gitea-automation/business-logic` for every concrete page object and every API client/entity. Neither service keeps its own copy anymore — each service's remaining "internal core" is only what's genuinely specific to its test runner (Vitest fixtures, Cucumber World/hooks, credential-resolution helpers).

## Selenium today, tool-agnostic boundary tomorrow

`ui/pages/**` is built on Selenium (via `core/ui/base-pages`), same as `core/ui/` itself — not reusable as-is by a future Playwright project. `api/**` has no such constraint (pure HTTP/JSON) and should be reusable by any future project regardless of UI tool. How a future Playwright-based project gets its own concrete page objects (its own copy here, a new package, or something else) is a decision for when that work starts.

## Imports

```ts
import { LoginPage } from "@gitea-automation/business-logic/ui/pages/authentication/login.page";
import { IssueClient } from "@gitea-automation/business-logic/api/clients/issue.client";
import type { Organization } from "@gitea-automation/business-logic/api/entities/organization.entity";
```
