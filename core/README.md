# core/

Purely organizational — **not an npm workspace itself** (no `package.json` here). Each subfolder below is its own independent package, separated by tool/concern so a future Playwright implementation doesn't get tangled up with the existing Selenium one.

```
core/
├── selenium/      @gitea-automation/core-selenium      — Selenium driver, drivers/api/config (WebDriver-coupled)
├── playwright/    @gitea-automation/core-playwright     — reserved, empty
├── page-objects/  @gitea-automation/core-page-objects   — Strategy pattern: the interfaces + Context classes every page object extends, plus both tools' concrete strategies
├── config/        @gitea-automation/core-config         — Gitea app config (baseUrl), tool-agnostic
├── data-handler/  @gitea-automation/core-data-handler   — test-data naming helpers, tool-agnostic
└── logger/        @gitea-automation/core-logger         — Logger adapter + Pino implementation, tool-agnostic
```

## Why split by tool instead of one `core` package

Each subfolder encapsulates exactly what it depends on: if a file has any real dependency on `selenium-webdriver` — even just one function's parameter type — it lives inside `core/selenium/`, not in a folder that's supposed to be tool-agnostic. `browserstack.config.ts` is the concrete example: it moved from a shared `config/` into `core/selenium/config/` because its `setSessionStatus()` takes a `WebDriver`. `core/config/` now holds only `gitea.config.ts`, which genuinely has zero tool dependency.

`core/page-objects/` is the one deliberate exception to "split by tool": it exists specifically to hold code that talks to _both_ tools (or neither, in the Context classes' case) behind one shared interface — see its own README for why that's not a contradiction of the rule above.

`core/selenium/` still keeps its own internal `api/` (the abstract `GiteaApiClient`) and `drivers/`/`config/`/`utils/` split — that layer distinction is still useful within a single tool's framework code, even though the folders around it are now organized by tool first. It used to also hold `ui/base-pages/` (`BaseComponent`/`BasePage`); those were retired once `core/page-objects/` replaced them for every page object in the monorepo.

## Read each package's own README

- [`core/selenium/README.md`](selenium/README.md)
- [`core/playwright/README.md`](playwright/README.md)
- [`core/page-objects/README.md`](page-objects/README.md)
- [`core/config/README.md`](config/README.md)
- [`core/data-handler/README.md`](data-handler/README.md)
- [`core/logger/README.md`](logger/README.md)
