# business-logic/

Purely organizational — **not an npm workspace itself** (no `package.json` here). Each subfolder below is its own independent package, split by tool.

```
business-logic/
├── selenium/    @gitea-automation/business-logic-selenium   — ui/pages + api/{clients,entities} for Selenium-based services
└── playwright/  @gitea-automation/business-logic-playwright — reserved, empty
```

## Why this exists

Both `services/gitea-selenium-vitest` and `services/gitea-selenium-cucumber` test the same Gitea instance with the same tool (Selenium) — they used to each keep their own copy of page objects (and `gitea-selenium-vitest` alone had the API clients/entities), which meant duplicating the same selectors and endpoint knowledge. `business-logic/selenium` is that shared layer now; neither service keeps its own copy.

## `selenium/` is now split into `ui/`+`api/`, like `core/selenium/` is

**Revision:** this package used to sit flat — `pages/`, `clients/`, `entities/` as direct siblings, deliberately without a `ui/`+`api/` wrapper, on the reasoning that at this level the axis that matters is "which tool" (Selenium vs. Playwright), not "which layer." That reasoning still holds one level up (`selenium/` vs. `playwright/` stays the top-level split), but within `selenium/` itself the same layer distinction `core/selenium/` already draws — browser-facing code (`ui/`) vs. HTTP-facing code (`api/`) — turned out to earn its keep here too, so `business-logic/selenium/` now nests `ui/pages/` and `api/{clients,entities}/` the same way `core/selenium/` nests `ui/` and `api/`. `business-logic/playwright/` will follow the same pattern once it starts.

## Read each package's own README

- [`business-logic/selenium/README.md`](selenium/README.md)
- [`business-logic/playwright/README.md`](playwright/README.md)
