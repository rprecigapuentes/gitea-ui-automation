# core

> The tool-level building blocks every suite stands on. None of them knows what Gitea is.

`core/` is a folder, not a package: each subfolder is its own npm workspace with its own
`package.json`, split by the tool it depends on, so a file that needs `selenium-webdriver` can never
sit somewhere meant to be tool-agnostic.

## Packages

| Package                                       | What it holds                                                               | Depends on                   |
| --------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------- |
| [`core-page-objects`](page-objects/README.md) | The Strategy pattern for page objects: one interface, two tools             | Selenium, Playwright, logger |
| [`core-api-client`](api-client/README.md)     | The same pattern for Gitea API clients                                      | `got`, Playwright            |
| [`core-selenium`](selenium/README.md)         | WebDriver lifecycle and BrowserStack configuration                          | `selenium-webdriver`         |
| [`core-playwright`](playwright/README.md)     | Playwright-only helpers with no Selenium equivalent: visual and performance | `@playwright/test`           |
| [`core-config`](config/README.md)             | The address of the Gitea under test                                         | nothing                      |
| [`core-data-handler`](data-handler/README.md) | Names for the data a test creates                                           | nothing                      |
| [`core-logger`](logger/README.md)             | The logging interface and its Pino implementation                           | `pino`                       |

## The rule

**A package depends only on what is beneath it.** `core` never imports `business-logic` or a
suite, which is what lets every suite reuse it unchanged. Two packages, `core-page-objects` and
`core-api-client`, talk to both tools on purpose: that is the point of a Strategy, and each keeps
the tool-specific half in its own `strategies/` folder.

```
services/*          the suites: specs, steps, fixtures
   │
business-logic      Gitea: page objects, API clients, entities, scenario state
   │
core/*              the tools: strategies, driver, logger, config
```

## Importing

Every package exports its files by path, so a module is imported by the name of its file:

```ts
import { BasePage } from "@gitea-automation/core-page-objects/base.page";
import { logger } from "@gitea-automation/core-logger/pino.logger";
```
