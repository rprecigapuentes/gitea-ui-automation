# @gitea-automation/core-selenium

Selenium WebDriver framework: driver lifecycle, base page/component classes, BrowserStack integration. No Gitea-specific knowledge — that's `@gitea-automation/business-logic-selenium`.

## Structure

```
core/selenium/
├── ui/
│   ├── base-pages/   # BaseComponent (find/click/type) + BasePage (+URL) + Navigable
│   └── drivers/       # driver.factory.ts — builds/quits a WebDriver (chrome/firefox/edge), remote grid + BrowserStack support
├── api/
│   └── gitea-client.client.ts   # abstract GiteaApiClient: shared got instance, auth header, request/response logging
└── config/
    └── browserstack.config.ts   # credentials, hubUrl, bstackOptions(), setSessionStatus() (WebDriver-typed — why this lives here, not in core-config)
```

`ui/`+`api/` is a layer split kept from the previous `core/` design — `ui/` is what any Selenium page object builds on, `api/` is what any Gitea API client builds on. `config/` holds BrowserStack config specifically because `setSessionStatus()` needs a real `WebDriver`.

## Why `GiteaApiClient` lives here and not in `business-logic-selenium`

It's shared HTTP framework (the `got` instance setup, the `Authorization: token` header, logging hooks) — not knowledge of any specific Gitea endpoint. The concrete clients that extend it (`IssueClient`, `LabelClient`, etc.) are the ones with real endpoint knowledge, and those live in `@gitea-automation/business-logic-selenium/api/clients/`.

## Dependencies

`@gitea-automation/core-logger` (for request/response logging in `gitea-client.client.ts` and `base-component.ts`), `selenium-webdriver`, `got` (used by `gitea-client.client.ts`).

## Imports

```ts
import { DriverFactory } from "@gitea-automation/core-selenium/ui/drivers/driver.factory";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";
import { GiteaApiClient } from "@gitea-automation/core-selenium/api/gitea-client.client";
import {
  isBrowserStack,
  setSessionStatus,
} from "@gitea-automation/core-selenium/config/browserstack.config";
```
