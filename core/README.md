# core/

Purely organizational — **not an npm workspace itself** (no `package.json` here). Each subfolder below is its own independent package, separated by tool/concern so a future Playwright implementation doesn't get tangled up with the existing Selenium one.

```
core/
├── selenium/      @gitea-automation/core-selenium      — Selenium driver, drivers/config (WebDriver-coupled)
├── playwright/    @gitea-automation/core-playwright     — reserved, empty
├── page-objects/  @gitea-automation/core-page-objects   — Strategy pattern: the interfaces + Context classes every page object extends, plus both tools' concrete strategies
├── api-client/    @gitea-automation/core-api-client     — Strategy pattern: the interface + GiteaApiClient every API client extends, plus a real got-based strategy
├── config/        @gitea-automation/core-config         — Gitea app config (baseUrl), tool-agnostic
├── data-handler/  @gitea-automation/core-data-handler   — test-data naming helpers, tool-agnostic
└── logger/        @gitea-automation/core-logger         — Logger adapter + Pino implementation, tool-agnostic
```

## Why split by tool instead of one `core` package

Each subfolder encapsulates exactly what it depends on: if a file has any real dependency on `selenium-webdriver` — even just one function's parameter type — it lives inside `core/selenium/`, not in a folder that's supposed to be tool-agnostic. `browserstack.config.ts` is the concrete example: it moved from a shared `config/` into `core/selenium/config/` because its `setSessionStatus()` takes a `WebDriver`. `core/config/` now holds only `gitea.config.ts`, which genuinely has zero tool dependency.

`core/page-objects/` and `core/api-client/` are the two deliberate exceptions to "split by tool": each exists specifically to hold code that talks to _both_ tools (or neither, in the Context classes' case) behind one shared interface — see their own READMEs for why that's not a contradiction of the rule above.

`core/selenium/` used to also hold `ui/base-pages/` (`BaseComponent`/`BasePage`) and `api/gitea-client.client.ts` (`GiteaApiClient`); both were retired once `core/page-objects/` and `core/api-client/` replaced them for every page object and API client in the monorepo. What's left (`ui/drivers/`, `ui/utils/`, `config/`) is genuinely Selenium-specific: driver lifecycle, the drag-event fallback, and BrowserStack session config.

## Read each package's own README

- [`core/selenium/README.md`](selenium/README.md)
- [`core/playwright/README.md`](playwright/README.md)
- [`core/page-objects/README.md`](page-objects/README.md)
- [`core/api-client/README.md`](api-client/README.md)
- [`core/config/README.md`](config/README.md)
- [`core/data-handler/README.md`](data-handler/README.md)
- [`core/logger/README.md`](logger/README.md)
