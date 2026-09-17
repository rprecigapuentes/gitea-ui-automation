# @gitea-automation/business-logic-common

Concrete Gitea page objects, technology-agnostic: the same `LoginPage`, `IssuePage`, `OrganizationFacade` and every fragment run against either Selenium or Playwright, depending only on which `IInteractionStrategy` gets injected into them at construction time. Neither `services/gitea-selenium-vitest` nor `services/gitea-selenium-cucumber` keeps its own copy, and a future Playwright service would reuse the exact same classes rather than duplicating them.

## Why "common" and not "selenium" or "playwright"

These pages used to live in `business-logic/selenium/ui/pages/`, importing `selenium-webdriver`'s `By`/`WebDriver`/`WebElement` directly. A Strategy pattern (`@gitea-automation/core-page-objects`) closed every one of those Selenium-specific call sites — locators became plain CSS-selector strings, and every interaction (`click`, `findElement`, drag-and-drop, custom waits, `executeScript`, …) now goes through the injected strategy instead of a driver a page holds itself. Once a page has no tool-specific code left, splitting it into a `selenium/` or `playwright/` package makes no sense — there's nothing tool-specific to split by. See [`business-logic/README.md`](../README.md) and [`core/page-objects/README.md`](../../core/page-objects/README.md) for the fuller story.

## Structure

```
business-logic/common/
└── ui/
    └── pages/     # Page/Fragment/Facade objects with real Gitea selectors, by feature:
        ├── authentication/
        ├── common/          # MainPage, NavBarFragment - shared across features, not Gitea-page-specific
        ├── issues/
        ├── organizations/
        ├── projects/
        └── repositories/
```

Every class extends `BaseComponent`/`BasePage` from `@gitea-automation/core-page-objects` (not `core-selenium` — that's the whole point) and takes an `IInteractionStrategy` in its constructor instead of a `WebDriver`.

## Dependencies

`@gitea-automation/core-page-objects` (`BaseComponent`/`BasePage`, `IInteractionStrategy`, `IElementHandle`), `@gitea-automation/core-config` (`baseUrl`), `@gitea-automation/core-logger`, `@gitea-automation/business-logic-selenium` (the `api/entities/**` shapes a page returns or accepts — those stay tool-agnostic data, not moved here). No dependency on `selenium-webdriver` or `@gitea-automation/core-selenium`: nothing here references either.

## Imports

```ts
import { LoginPage } from "@gitea-automation/business-logic-common/ui/pages/authentication/login.page";
import { IssuePage } from "@gitea-automation/business-logic-common/ui/pages/issues/issue.page";
```

## Constructing a page

Whoever builds a page picks the strategy, not the page itself:

```ts
import { createSeleniumStrategy } from "@gitea-automation/core-page-objects/selenium-interaction.strategy";
// or: import { createPlaywrightStrategy } from "@gitea-automation/core-page-objects/playwright-interaction.strategy";

const strategy = createSeleniumStrategy(driver); // or createPlaywrightStrategy(page)
const loginPage = new LoginPage(strategy);
```

`services/gitea-selenium-cucumber/features/support/page.factory.ts` and `services/gitea-selenium-vitest/src/fixtures/fixture.ts` do exactly this today, wrapping a real Selenium `WebDriver`.

## Current limitation

`PlaywrightInteractionStrategy` (in `core-page-objects`) is a stub — every method logs and returns a placeholder, so a page constructed with it typechecks and runs without throwing, but doesn't drive a real browser yet. That's deliberate: this package proves pages have no remaining Selenium dependency; making the Playwright side actually work is separate, not-yet-started work.
