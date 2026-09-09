# @gitea-automation/core-config

Gitea application configuration — genuinely tool-agnostic (no `selenium-webdriver`, no `playwright` dependency).

## Structure

```
core/config/
└── gitea.config.ts   # baseUrl, from GITEA_BASE_URL (import "dotenv/config" side-effect)
```

Only one file. `browserstack.config.ts` used to live here too, but it moved to [`core/selenium/config/`](../selenium/README.md) because one of its functions (`setSessionStatus`) is typed with `WebDriver` — a real Selenium dependency, so it belongs inside `core-selenium`, not in a package meant to be tool-agnostic.

## Imports

```ts
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
```
