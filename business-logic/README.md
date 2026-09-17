# @gitea-automation/business-logic

Gitea's HTTP surface (API clients/entities), the concrete page objects, and cross-step scenario state — all technology-agnostic, shared by every test runner in this monorepo: `services/gitea-selenium-vitest`, `services/gitea-selenium-cucumber`, `services/playwright-native`. None of them keeps its own copy of any of this.

## Structure

```
business-logic/
├── clients/    # auth/issue/label/milestone/organizations/repository/team/user — all but auth extend GiteaApiClient from @gitea-automation/core-api-client
├── entities/   # issue/label/milestone/organization/repository/team/user — the shapes those clients return
├── state/
│   └── scenario.entity.ts   # ScenarioState — cross-step scenario data (organization/team1/team2), shared by every test runner
└── pages/      # concrete Gitea page objects, extending core-page-objects' BaseComponent/BasePage
    ├── page.factory.ts   # PageFactory — lazy, memoized getters for the pages a scenario needs
    ├── authentication/, common/, issues/, organizations/, projects/, repositories/   # one folder per feature area, fragments/facade nested where a page has them
```

## Why one package instead of two

This used to be two packages, `business-logic/api` (clients/entities/state) and `business-logic/common` (pages), split the way `core/` still is: one package per technology. That distinction never actually held here — neither package ever had a real dependency on a specific browser/HTTP technology. Every client but `auth.client.ts` already works against either `GotRequestStrategy` or `PlaywrightRequestStrategy` (`auth.client.ts` itself is plain `got` + a cookie jar, usable from any browser technology), and every page already works against either `SeleniumInteractionStrategy` or `PlaywrightInteractionStrategy`, chosen by whichever `IInteractionStrategy` its caller injects. Splitting by technology only made sense back when `ui/pages/` still imported `selenium-webdriver` directly — once the Strategy pattern (`@gitea-automation/core-page-objects`) closed that gap, two tech-agnostic packages became one, with exactly four folders: `clients/`, `pages/`, `entities/`, `state/`.

`state/` is a sibling of `clients/`/`entities/`, not nested under either — not an API payload (`ScenarioState` never travels over HTTP; it's local bookkeeping a test mutates as a scenario runs, e.g. "which organization did this scenario create", read back later for both page objects and cleanup). Putting it in `entities/` alongside `Organization`/`Team` would mix two different things: a real Gitea API response shape vs. local per-scenario state that merely references those shapes.

## Constructing a client

Whoever builds a client picks the strategy, through `RequestStrategyFactory` (`@gitea-automation/core-api-client`), not the client itself:

```ts
import { RequestStrategyFactory } from "@gitea-automation/core-api-client/request-strategy.factory";
import { IssueClient } from "@gitea-automation/business-logic/clients/issue.client";

const issueClient = new IssueClient(RequestStrategyFactory.got(baseUrl, token));
// or: new IssueClient(RequestStrategyFactory.playwright(baseUrl, token));
```

## Constructing a page

Same idea, through `InteractionStrategyFactory` (`@gitea-automation/core-page-objects`):

```ts
import { InteractionStrategyFactory } from "@gitea-automation/core-page-objects/interaction-strategy.factory";
import { LoginPage } from "@gitea-automation/business-logic/pages/authentication/login.page";

const loginPage = new LoginPage(InteractionStrategyFactory.selenium(driver));
// or: new LoginPage(InteractionStrategyFactory.playwright(page));
```

## PageFactory

`pages/page.factory.ts` is a lazy, memoized getter for every page/fragment (`this.pages.loginPage`, `this.pages.orgFacade`, ...), built once from an already-constructed `IInteractionStrategy` and a `ScenarioState`:

```ts
import { PageFactory } from "@gitea-automation/business-logic/pages/page.factory";

const pages = new PageFactory(strategy, scenarioState);
pages.loginPage.login(username, password);
```

It never picks a strategy itself — whoever constructs it already has. `gitea-selenium-cucumber`'s `GiteaWorld.pages` and `playwright-native`'s `pages` fixture are both a `PageFactory` built this way, one from `InteractionStrategyFactory.selenium(driver)`, the other from `InteractionStrategyFactory.playwright(page)`.

## Current limitation

`PlaywrightInteractionStrategy` (in `core-page-objects`) is a stub — every method logs and returns a placeholder, so a page constructed with it typechecks and runs without throwing, but doesn't drive a real browser yet. That's deliberate: this package's pages have no remaining Selenium dependency; making the Playwright side actually work is separate, not-yet-started work.

## Dependencies

`@gitea-automation/core-api-client` (`GiteaApiClient` for every `clients/` file except `auth.client.ts`), `@gitea-automation/core-page-objects` (`BaseComponent`/`BasePage`, `IInteractionStrategy`, `IElementHandle`), `@gitea-automation/core-config` (`baseUrl`), `@gitea-automation/core-logger` (for `auth.client.ts`), `got`, `tough-cookie` (`auth.client.ts`'s form-login + cookie jar).

## Imports

```ts
import { IssueClient } from "@gitea-automation/business-logic/clients/issue.client";
import type { Organization } from "@gitea-automation/business-logic/entities/organization.entity";
import type { ScenarioState } from "@gitea-automation/business-logic/state/scenario.entity";
import { LoginPage } from "@gitea-automation/business-logic/pages/authentication/login.page";
```
