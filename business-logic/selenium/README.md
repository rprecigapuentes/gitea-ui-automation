# @gitea-automation/business-logic-selenium

Concrete Gitea page objects and API clients/entities, shared by every Selenium-based service in this monorepo. Neither `services/gitea-selenium-vitest` nor `services/gitea-selenium-cucumber` keeps its own copy of any of this.

## Structure

```
business-logic/selenium/
├── ui/
│   └── pages/      # Page/Fragment/Facade objects with real Gitea selectors, by feature: authentication/, common/, issues/, organizations/
├── api/
│   ├── clients/     # auth/issue/label/milestone/organizations/repository/user — extend GiteaApiClient from @gitea-automation/core-selenium
│   └── entities/    # issue/label/milestone/organization/repository/team/user — the shapes those clients return
└── state/
    └── scenario.entity.ts   # ScenarioState — cross-step scenario data (organization/team1/team2), shared by gitea-selenium-vitest and gitea-selenium-cucumber
```

`state/` is a third top-level folder, sibling to `ui/` and `api/` — not a page object, and not an API payload either (`ScenarioState` never travels over HTTP; it's local bookkeeping a test mutates as a scenario runs, e.g. "which organization did this scenario create", read back later for both page objects and cleanup). Putting it in `api/entities/` alongside `Organization`/`Team` would mix two different things: a real Gitea API response shape vs. local per-scenario state that merely references those shapes.

**Revision:** this package used to sit flat (`pages/`, `clients/`, `entities/` as siblings, no `ui/`/`api/` wrapper) — see [`business-logic/README.md`](../README.md) for the reasoning behind that reversal. `ui/` and `api/` are now nested inside `selenium/` the same way they already are inside `core/selenium/`, one level deeper than before.

## Dependencies

`@gitea-automation/core-selenium` (`BasePage`/`BaseComponent` for `ui/pages/`, `GiteaApiClient` for `api/clients/`), `@gitea-automation/core-config` (`baseUrl` for `ui/pages/`), `@gitea-automation/core-logger` (for `api/clients/auth.client.ts`, which is standalone and doesn't extend `GiteaApiClient`), `selenium-webdriver`, `got`, `tough-cookie` (`auth.client.ts`'s form-login + cookie jar).

## Imports

```ts
import { LoginPage } from "@gitea-automation/business-logic-selenium/ui/pages/authentication/login.page";
import { IssueClient } from "@gitea-automation/business-logic-selenium/api/clients/issue.client";
import type { Organization } from "@gitea-automation/business-logic-selenium/api/entities/organization.entity";
```
