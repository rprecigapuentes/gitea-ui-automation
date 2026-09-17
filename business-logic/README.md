# business-logic/

Purely organizational — **not an npm workspace itself** (no `package.json` here). Each subfolder below is its own independent package.

```
business-logic/
├── selenium/  @gitea-automation/business-logic-selenium — api/{clients,entities} + state, Selenium-service-specific
└── common/    @gitea-automation/business-logic-common   — ui/pages, technology-agnostic (Strategy pattern, see core/page-objects)
```

## Why this exists

Both `services/gitea-selenium-vitest` and `services/gitea-selenium-cucumber` test the same Gitea instance — they used to each keep their own copy of page objects (and `gitea-selenium-vitest` alone had the API clients/entities), which meant duplicating the same selectors and endpoint knowledge. `business-logic/selenium/api/` is that shared layer for Gitea's HTTP surface; neither service keeps its own copy.

## `ui/pages/` moved out to `business-logic/common/`

This package used to hold both `ui/pages/` and `api/{clients,entities}/`, split the same way `core/` was: one tool-named package per tool, `ui/`+`api/` nested inside each (`business-logic/selenium/` mirroring `core/selenium/`, with a `business-logic/playwright/` reserved as its future sibling). That stopped making sense once a Strategy pattern (`@gitea-automation/core-page-objects`) let one concrete page class run against either Selenium or Playwright, chosen by whichever `IInteractionStrategy` its caller injects — a page object no longer has any tool-specific code to be split by. Pages now live in `business-logic/common/ui/pages/`, extending `core-page-objects`' `BaseComponent`/`BasePage` instead of `core-selenium`'s, with locators as plain CSS-selector strings instead of Selenium's `By`. `business-logic/playwright/` — reserved for a page-objects package of its own — was removed once this made it clear no such package would ever hold anything.

`business-logic/selenium/` keeps `api/{clients,entities}/` and `state/`: Gitea's HTTP surface and cross-step scenario state, both still specific to the Selenium-based services (`gitea-selenium-vitest`, `gitea-selenium-cucumber`) and unaffected by the page-objects move.

## Read each package's own README

- [`business-logic/selenium/README.md`](selenium/README.md)
- [`business-logic/common/README.md`](common/README.md)
