# Gitea UI Automation — monorepo

An `npm workspaces` monorepo grouping Gitea UI/API automation into several independent projects, each with its own testing tool or style, sharing common code under `core/` and `business-logic/`.

```
/
├── core/                          # organizational only — each subfolder is its own package
│   ├── selenium/                   # @gitea-automation/core-selenium — Selenium driver, base pages, BrowserStack
│   ├── playwright/                 # @gitea-automation/core-playwright — reserved, empty
│   ├── config/                     # @gitea-automation/core-config — Gitea app config, tool-agnostic
│   ├── data-handler/               # @gitea-automation/core-data-handler — test-data naming, tool-agnostic
│   └── logger/                     # @gitea-automation/core-logger — logging, tool-agnostic
├── business-logic/                # organizational only — each subfolder is its own package
│   ├── selenium/                   # @gitea-automation/business-logic-selenium — concrete Gitea pages + API clients/entities
│   └── playwright/                 # @gitea-automation/business-logic-playwright — reserved, empty
├── services/
│   ├── gitea-selenium-vitest/     # Selenium + Vitest — active project, full suite
│   ├── gitea-selenium-cucumber/   # Selenium + Cucumber (BDD) — under construction
│   ├── playwright-native/         # reserved — no code yet
│   └── playwright-bdd/            # reserved — no code yet
```

`core/` and `business-logic/` are **not workspaces themselves** — no `package.json` at that level, purely folders for organizing their subfolder-packages. Each subfolder underneath them is.

## Installation

```bash
npm install
```

Installs the dependencies of every workspace (5 under `core/`, 2 under `business-logic/`, and the 4 services) in one shot.

## Root scripts (delegate to the matching workspace)

| Script                                               | What it does                                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm test`                                           | `gitea-selenium-vitest` suite, 3 local browsers (single Vitest run)                                       |
| `npm run test:chrome` / `test:firefox` / `test:edge` | One browser at a time (`gitea-selenium-vitest`)                                                           |
| `npm run test:parallel`                              | `gitea-selenium-vitest`, the 3 browsers as 3 genuinely concurrent processes, one JUnit report per browser |
| `npm run test:serial`                                | Same suite, one file at a time                                                                            |
| `npm run test:browserstack`                          | `gitea-selenium-vitest` suite against BrowserStack                                                        |
| `npm run test:cucumber`                              | `gitea-selenium-cucumber` suite, default browser (chrome)                                                 |
| `npm run test:cucumber:parallel`                     | `gitea-selenium-cucumber`, the 3 browsers as 3 concurrent processes                                       |
| `npm run report` / `report:open`                     | Allure report for `gitea-selenium-vitest`                                                                 |
| `npm run lint` / `lint:fix`                          | ESLint across the whole monorepo                                                                          |
| `npm run typecheck`                                  | `tsc --noEmit` in every workspace that defines it                                                         |
| `npm run format` / `format:check`                    | Prettier across the whole monorepo                                                                        |

`test:parallel` and `test:cucumber:parallel` run three separate OS processes (via `concurrently`), one per browser — a stronger guarantee of real 3-way parallelism than relying on a single process to schedule everything internally. See [`services/gitea-selenium-vitest/README.md`](services/gitea-selenium-vitest/README.md) for why each mode exists and how JUnit output is kept from colliding.

## Each project

- **[core](core/README.md)** — organizational root for 5 packages: [`core-selenium`](core/selenium/README.md) (Selenium driver + base pages), [`core-playwright`](core/playwright/README.md) (reserved), [`core-config`](core/config/README.md), [`core-data-handler`](core/data-handler/README.md), [`core-logger`](core/logger/README.md) — all tool-and-domain-agnostic except `core-selenium`.
- **[business-logic](business-logic/README.md)** — organizational root for 2 packages: [`business-logic-selenium`](business-logic/selenium/README.md) (concrete Gitea page objects + API clients/entities, shared by every Selenium-based service below — neither `gitea-selenium-vitest` nor `gitea-selenium-cucumber` keeps its own copy) and [`business-logic-playwright`](business-logic/playwright/README.md) (reserved).
- **[services/gitea-selenium-vitest](services/gitea-selenium-vitest/README.md)** — the original suite: Selenium WebDriver + Vitest, BrowserStack, Allure, multi-account/multi-browser credentials. Full documentation in its own README.
- **[services/gitea-selenium-cucumber](services/gitea-selenium-cucumber/README.md)** — Selenium + Cucumber (BDD/Gherkin). Scaffold with a working login feature, run across all 3 browsers; under construction.
- **services/playwright-native** and **services/playwright-bdd** — reserved for future Playwright-based automation. Today they're empty workspaces (just a `package.json`), no code or dependencies.

## CI/CD

`.gitea/workflows/` runs on the project's own Gitea instance (self-hosted, GitHub Actions-compatible syntax):

- `ci.yml` — on every push/PR: `npm ci` + `format:check` + `lint` + `typecheck` across the whole monorepo. Never runs real tests, never blocked by external infra.
- `ct.yml` — "Continuous Testing": deploys a disposable Gitea + Selenium and runs the `gitea-selenium-vitest` suite (plain `npm test`, the single-process 3-browser run) against them. Manual dispatch + daily weekday cron.
- `bs.yml` — same as `ct.yml` but against BrowserStack (`gitea-selenium-vitest` only). Manual dispatch + weekly cron.

Both pipelines stay on `gitea-selenium-vitest` with its normal (non-`:parallel`) scripts for now — `gitea-selenium-cucumber` isn't wired into CI yet.
