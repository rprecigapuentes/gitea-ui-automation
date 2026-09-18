# @gitea-automation/core-selenium

Selenium WebDriver framework: driver lifecycle, BrowserStack integration. No Gitea-specific knowledge — that's `@gitea-automation/business-logic`.

Used to also hold `ui/base-pages/` (`BaseComponent`/`BasePage`) and `api/gitea-client.client.ts` (`GiteaApiClient`) — those were retired once `@gitea-automation/core-page-objects` and `@gitea-automation/core-api-client` replaced them with technology-agnostic equivalents every page object and API client in the monorepo now extends instead. `utils/html5-drag.util.ts` moved there too, into `core-page-objects/strategies/utils/`, alongside its Playwright counterpart — the only thing that ever imported it was the Selenium strategy, already living in that package. See [`core/page-objects/README.md`](../page-objects/README.md) and [`core/api-client/README.md`](../api-client/README.md).

## Structure

```
core/selenium/
├── drivers/
│   └── driver.factory.ts   # builds/quits a WebDriver (chrome/firefox/edge), remote grid + BrowserStack support
└── browserstack-config/
    └── browserstack.config.ts   # credentials, hubUrl, bstackOptions(), setSessionStatus() (WebDriver-typed — why this lives here, not in core-config)
```

No `ui/` wrapper anymore — `drivers/` and the retired `utils/` were the only thing inside it, so the folder said nothing a flatter structure didn't already say. `config/` renamed to `browserstack-config/` for the same reason: everything in it is BrowserStack-specific, and the old name didn't say that.

## Dependencies

`selenium-webdriver`. Nothing else — `got` and `@gitea-automation/core-logger` were only needed by the now-retired `api/gitea-client.client.ts`.

## Imports

```ts
import { DriverFactory } from "@gitea-automation/core-selenium/drivers/driver.factory";
import {
  isBrowserStack,
  setSessionStatus,
} from "@gitea-automation/core-selenium/browserstack-config/browserstack.config";
```
