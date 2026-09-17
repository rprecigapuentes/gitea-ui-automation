# @gitea-automation/core-selenium

Selenium WebDriver framework: driver lifecycle, BrowserStack integration. No Gitea-specific knowledge — that's `@gitea-automation/business-logic-api`.

Used to also hold `ui/base-pages/` (`BaseComponent`/`BasePage`) and `api/gitea-client.client.ts` (`GiteaApiClient`) — those were retired once `@gitea-automation/core-page-objects` and `@gitea-automation/core-api-client` replaced them with technology-agnostic equivalents every page object and API client in the monorepo now extends instead. See [`core/page-objects/README.md`](../page-objects/README.md) and [`core/api-client/README.md`](../api-client/README.md).

## Structure

```
core/selenium/
├── ui/
│   ├── drivers/       # driver.factory.ts — builds/quits a WebDriver (chrome/firefox/edge), remote grid + BrowserStack support
│   └── utils/         # html5-drag.util.ts — the event-dispatch drag fallback core-page-objects' Selenium strategy uses
└── config/
    └── browserstack.config.ts   # credentials, hubUrl, bstackOptions(), setSessionStatus() (WebDriver-typed — why this lives here, not in core-config)
```

`config/` holds BrowserStack config specifically because `setSessionStatus()` needs a real `WebDriver`.

## Dependencies

`selenium-webdriver`. Nothing else — `got` and `@gitea-automation/core-logger` were only needed by the now-retired `api/gitea-client.client.ts`.

## Imports

```ts
import { DriverFactory } from "@gitea-automation/core-selenium/ui/drivers/driver.factory";
import {
  isBrowserStack,
  setSessionStatus,
} from "@gitea-automation/core-selenium/config/browserstack.config";
```
