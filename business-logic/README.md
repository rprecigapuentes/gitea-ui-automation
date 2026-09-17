# business-logic/

Purely organizational — **not an npm workspace itself** (no `package.json` here). Each subfolder below is its own independent package.

```
business-logic/
├── api/     @gitea-automation/business-logic-api    — api/{clients,entities} + state, technology-agnostic, shared by every test runner
└── common/  @gitea-automation/business-logic-common — ui/pages, technology-agnostic (Strategy pattern, see core/page-objects)
```

## Why this exists

`services/gitea-selenium-vitest`, `services/gitea-selenium-cucumber`, and `services/playwright-native` all test the same Gitea instance — they used to each keep their own copy of page objects (and `gitea-selenium-vitest` alone had the API clients/entities), which meant duplicating the same selectors and endpoint knowledge. `business-logic/api/api/` is that shared layer for Gitea's HTTP surface; none of the three keeps its own copy.

## `ui/pages/` moved out to `business-logic/common/`

This package used to hold both `ui/pages/` and `api/{clients,entities}/`, split the same way `core/` was: one tool-named package per tool, `ui/`+`api/` nested inside each (this package, then named `business-logic/selenium/`, mirroring `core/selenium/`, with a `business-logic/playwright/` reserved as its future sibling). That stopped making sense once a Strategy pattern (`@gitea-automation/core-page-objects`) let one concrete page class run against either Selenium or Playwright, chosen by whichever `IInteractionStrategy` its caller injects — a page object no longer has any tool-specific code to be split by. Pages now live in `business-logic/common/ui/pages/`, extending `core-page-objects`' `BaseComponent`/`BasePage` instead of `core-selenium`'s, with locators as plain CSS-selector strings instead of Selenium's `By`. `business-logic/playwright/` — reserved for a page-objects package of its own — was removed once this made it clear no such package would ever hold anything.

## `business-logic/selenium/` renamed to `business-logic/api/`

This package kept `api/{clients,entities}/` and `state/` — Gitea's HTTP surface and cross-step scenario state — and its name still said "selenium" long after it stopped being true: no file here ever imported `selenium-webdriver`, and every client but `auth.client.ts` already works against either `GotRequestStrategy` or `PlaywrightRequestStrategy` (`auth.client.ts` itself is plain `got` + a cookie jar, usable from any browser technology). `services/playwright-native` consuming it made the stale name impossible to ignore, so it's now `business-logic/api/`, matching what it's always actually been.

## Read each package's own README

- [`business-logic/api/README.md`](api/README.md)
- [`business-logic/common/README.md`](common/README.md)
