# @gitea-automation/core-selenium

Selenium WebDriver framework: driver lifecycle, BrowserStack integration, the abstract Gitea API client. No Gitea-specific knowledge — that's `@gitea-automation/business-logic-selenium`.

Used to also hold `ui/base-pages/` (`BaseComponent`/`BasePage`, the classes every page object extended) — those were retired once `@gitea-automation/core-page-objects` replaced them with technology-agnostic equivalents every page object in the monorepo now extends instead. See [`core/page-objects/README.md`](../page-objects/README.md).

## Structure

```
core/selenium/
├── ui/
│   ├── drivers/       # driver.factory.ts — builds/quits a WebDriver (chrome/firefox/edge), remote grid + BrowserStack support
│   └── utils/         # html5-drag.util.ts — the event-dispatch drag fallback core-page-objects' Selenium strategy uses
├── api/
│   └── gitea-client.client.ts   # abstract GiteaApiClient: shared got instance, auth header, request/response logging
└── config/
    └── browserstack.config.ts   # credentials, hubUrl, bstackOptions(), setSessionStatus() (WebDriver-typed — why this lives here, not in core-config)
```

`ui/`+`api/` is a layer split kept from the previous `core/` design — `ui/` is what drives a real browser, `api/` is what any Gitea API client builds on. `config/` holds BrowserStack config specifically because `setSessionStatus()` needs a real `WebDriver`.

## Why `GiteaApiClient` lives here and not in `business-logic-selenium`

It's shared HTTP framework (the `got` instance setup, the `Authorization: token` header, logging hooks) — not knowledge of any specific Gitea endpoint. The concrete clients that extend it (`IssueClient`, `LabelClient`, etc.) are the ones with real endpoint knowledge, and those live in `@gitea-automation/business-logic-selenium/api/clients/`.

## Dependencies

`@gitea-automation/core-logger` (for request/response logging in `gitea-client.client.ts`), `selenium-webdriver`, `got` (used by `gitea-client.client.ts`).

## Imports

```ts
import { DriverFactory } from "@gitea-automation/core-selenium/ui/drivers/driver.factory";
import { GiteaApiClient } from "@gitea-automation/core-selenium/api/gitea-client.client";
import {
  isBrowserStack,
  setSessionStatus,
} from "@gitea-automation/core-selenium/config/browserstack.config";
```
