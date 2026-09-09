# @gitea-automation/business-logic-selenium

Concrete Gitea page objects and API clients/entities, shared by every Selenium-based service in this monorepo. Neither `services/gitea-selenium-vitest` nor `services/gitea-selenium-cucumber` keeps its own copy of any of this.

## Structure

```
business-logic/selenium/
├── ui/
│   └── pages/      # Page/Fragment/Facade objects with real Gitea selectors, by feature: authentication/, common/, issues/, organizations/
└── api/
    ├── clients/     # auth/issue/label/milestone/organizations/repository/user — extend GiteaApiClient from @gitea-automation/core-selenium
    └── entities/    # issue/label/milestone/organization/repository/team/user — the shapes those clients return
```

**Revision:** this package used to sit flat (`pages/`, `clients/`, `entities/` as siblings, no `ui/`/`api/` wrapper) — see [`business-logic/README.md`](../README.md) for the reasoning behind that reversal. `ui/` and `api/` are now nested inside `selenium/` the same way they already are inside `core/selenium/`, one level deeper than before.

## Dependencies

`@gitea-automation/core-selenium` (`BasePage`/`BaseComponent` for `ui/pages/`, `GiteaApiClient` for `api/clients/`), `@gitea-automation/core-config` (`baseUrl` for `ui/pages/`), `@gitea-automation/core-logger` (for `api/clients/auth.client.ts`, which is standalone and doesn't extend `GiteaApiClient`), `selenium-webdriver`, `got`, `tough-cookie` (`auth.client.ts`'s form-login + cookie jar).

## Imports

```ts
import { LoginPage } from "@gitea-automation/business-logic-selenium/ui/pages/authentication/login.page";
import { IssueClient } from "@gitea-automation/business-logic-selenium/api/clients/issue.client";
import type { Organization } from "@gitea-automation/business-logic-selenium/api/entities/organization.entity";
```
