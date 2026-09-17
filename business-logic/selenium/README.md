# @gitea-automation/business-logic-selenium

Gitea's HTTP surface (API clients/entities) and cross-step scenario state, shared by every Selenium-based service in this monorepo. Neither `services/gitea-selenium-vitest` nor `services/gitea-selenium-cucumber` keeps its own copy of any of this.

Concrete page objects used to live here too (`ui/pages/`), but moved to `@gitea-automation/business-logic-common` once a Strategy pattern made them technology-agnostic — see [`business-logic/README.md`](../README.md) for why. This package no longer has a `ui/` folder.

## Structure

```
business-logic/selenium/
├── api/
│   ├── clients/     # auth/issue/label/milestone/organizations/repository/team/user — extend GiteaApiClient from @gitea-automation/core-selenium
│   └── entities/    # issue/label/milestone/organization/repository/team/user — the shapes those clients return
└── state/
    └── scenario.entity.ts   # ScenarioState — cross-step scenario data (organization/team1/team2), shared by gitea-selenium-vitest and gitea-selenium-cucumber
```

`state/` is a second top-level folder, sibling to `api/` — not an API payload (`ScenarioState` never travels over HTTP; it's local bookkeeping a test mutates as a scenario runs, e.g. "which organization did this scenario create", read back later for both page objects and cleanup). Putting it in `api/entities/` alongside `Organization`/`Team` would mix two different things: a real Gitea API response shape vs. local per-scenario state that merely references those shapes.

## Dependencies

`@gitea-automation/core-selenium` (`GiteaApiClient` for `api/clients/`), `@gitea-automation/core-config` (`baseUrl`), `@gitea-automation/core-logger` (for `api/clients/auth.client.ts`, which is standalone and doesn't extend `GiteaApiClient`), `got`, `tough-cookie` (`auth.client.ts`'s form-login + cookie jar).

## Imports

```ts
import { IssueClient } from "@gitea-automation/business-logic-selenium/api/clients/issue.client";
import type { Organization } from "@gitea-automation/business-logic-selenium/api/entities/organization.entity";
import type { ScenarioState } from "@gitea-automation/business-logic-selenium/state/scenario.entity";
```
