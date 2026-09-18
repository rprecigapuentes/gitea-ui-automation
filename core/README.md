# core/

Purely organizational — **not an npm workspace itself** (no `package.json` here). Each subfolder below is its own independent package, separated by tool/concern so a future Playwright implementation doesn't get tangled up with the existing Selenium one.

```
core/
├── selenium/      @gitea-automation/core-selenium      — Selenium driver, drivers/browserstack-config (WebDriver-coupled)
├── page-objects/  @gitea-automation/core-page-objects   — Strategy pattern: the interfaces + Context classes every page object extends, strategies/ for both tools, InteractionStrategyFactory
├── api-client/    @gitea-automation/core-api-client     — Strategy pattern: the interface + GiteaApiClient every API client extends, strategies/ for both tools, RequestStrategyFactory
├── config/        @gitea-automation/core-config         — Gitea app config (baseUrl), tool-agnostic
├── data-handler/  @gitea-automation/core-data-handler   — test-data naming helpers, tool-agnostic
└── logger/        @gitea-automation/core-logger         — Logger adapter + Pino implementation, tool-agnostic
```

## Why split by tool instead of one `core` package

Each subfolder encapsulates exactly what it depends on: if a file has any real dependency on `selenium-webdriver` — even just one function's parameter type — it lives inside `core/selenium/`, not in a folder that's supposed to be tool-agnostic. `browserstack.config.ts` is the concrete example: it lives in `core/selenium/browserstack-config/` because its `setSessionStatus()` takes a `WebDriver`. `core/config/` holds only `gitea.config.ts`, which genuinely has zero tool dependency.

`core/page-objects/` and `core/api-client/` are the two deliberate exceptions to "split by tool": each exists specifically to hold code that talks to _both_ tools (or neither, in the Context classes' case) behind one shared interface — see their own READMEs for why that's not a contradiction of the rule above. Each also holds both tools' concrete strategy implementations in its own `strategies/` subfolder, and a Factory (`InteractionStrategyFactory`, `RequestStrategyFactory`) as the one place that picks between them.

`core/selenium/` used to also hold `ui/base-pages/` (`BaseComponent`/`BasePage`), `api/gitea-client.client.ts` (`GiteaApiClient`), and `utils/html5-drag.util.ts`; all three were retired once `core/page-objects/` and `core/api-client/` replaced them — the drag util moved into `core/page-objects/strategies/utils/`, next to its Playwright counterpart, since the Selenium strategy that's its only caller already lives there. What's left (`drivers/`, `browserstack-config/`) is genuinely Selenium-specific: driver lifecycle and BrowserStack session config — no `ui/` wrapper folder anymore, since those two are the only thing inside it.

## Read each package's own README

- [`core/selenium/README.md`](selenium/README.md)
- [`core/page-objects/README.md`](page-objects/README.md)
- [`core/api-client/README.md`](api-client/README.md)
- [`core/config/README.md`](config/README.md)
- [`core/data-handler/README.md`](data-handler/README.md)
- [`core/logger/README.md`](logger/README.md)
