# Gitea UI Automation — monorepo

An `npm workspaces` monorepo grouping Gitea UI/API automation into several independent projects, each with its own testing tool or style, sharing common code under `core/` and `business-logic/`.

```
/
├── core/                          # organizational only — each subfolder is its own package
│   ├── selenium/                   # @gitea-automation/core-selenium — Selenium driver, api/config, BrowserStack
│   ├── playwright/                 # @gitea-automation/core-playwright — reserved, empty
│   ├── page-objects/                # @gitea-automation/core-page-objects — Strategy pattern: interfaces, Context classes, both tools' strategies
│   ├── config/                     # @gitea-automation/core-config — Gitea app config, tool-agnostic
│   ├── data-handler/               # @gitea-automation/core-data-handler — test-data naming, tool-agnostic
│   └── logger/                     # @gitea-automation/core-logger — logging, tool-agnostic
├── business-logic/                # organizational only — each subfolder is its own package
│   ├── selenium/                   # @gitea-automation/business-logic-selenium — API clients/entities + scenario state
│   └── common/                     # @gitea-automation/business-logic-common — concrete Gitea pages, technology-agnostic
├── services/
│   ├── gitea-selenium-vitest/     # Selenium + Vitest — active project, full suite
│   ├── gitea-selenium-cucumber/   # Selenium + Cucumber (BDD) — under construction
│   ├── playwright-native/         # Playwright's native test runner — scaffolded and runnable, no Gitea test yet
│   └── playwright-bdd/            # reserved — no code yet
```

`core/` and `business-logic/` are **not workspaces themselves** — no `package.json` at that level, purely folders for organizing their subfolder-packages. Each subfolder underneath them is.

## Installation

```bash
npm install
```

Installs the dependencies of every workspace (6 under `core/`, 2 under `business-logic/`, and the 4 services) in one shot.

## Root scripts (delegate to the matching workspace)

| Script                                               | What it does                                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm test`                                           | `gitea-selenium-vitest` suite, 3 local browsers (single Vitest run)                                       |
| `npm run test:chrome` / `test:firefox` / `test:edge` | One browser at a time (`gitea-selenium-vitest`)                                                           |
| `npm run test:parallel`                              | `gitea-selenium-vitest`, the 3 browsers as 3 genuinely concurrent processes, one JUnit report per browser |
| `npm run test:serial`                                | Same suite, one file at a time                                                                            |
| `npm run test:browserstack`                          | `gitea-selenium-vitest` suite against BrowserStack                                                        |
| `npm run test:cucumber`                              | `gitea-selenium-cucumber` suite, the 3 browsers as 3 concurrent processes (what CT runs)                  |
| `npm run test:cucumber:parallel`                     | The same three, under the explicit name                                                                   |
| `npm run report` / `report:open`                     | Allure report for `gitea-selenium-vitest`                                                                 |
| `npm run lint` / `lint:fix`                          | ESLint across the whole monorepo                                                                          |
| `npm run typecheck`                                  | `tsc --noEmit` in every workspace that defines it                                                         |
| `npm run format` / `format:check`                    | Prettier across the whole monorepo                                                                        |

`test:parallel` and `test:cucumber:parallel` run three separate OS processes (via `concurrently`), one per browser — a stronger guarantee of real 3-way parallelism than relying on a single process to schedule everything internally. See [`services/gitea-selenium-vitest/README.md`](services/gitea-selenium-vitest/README.md) for why each mode exists and how JUnit output is kept from colliding.

## Each project

- **[core](core/README.md)** — organizational root for 6 packages: [`core-selenium`](core/selenium/README.md) (Selenium driver + api/config), [`core-playwright`](core/playwright/README.md) (reserved), [`core-page-objects`](core/page-objects/README.md) (the Strategy pattern: interfaces, Context classes, both tools' strategies), [`core-config`](core/config/README.md), [`core-data-handler`](core/data-handler/README.md), [`core-logger`](core/logger/README.md) — all tool-and-domain-agnostic except `core-selenium` (and `core-page-objects`, deliberately, since it's what bridges the two tools).
- **[business-logic](business-logic/README.md)** — organizational root for 2 packages: [`business-logic-selenium`](business-logic/selenium/README.md) (Gitea API clients/entities + cross-step scenario state) and [`business-logic-common`](business-logic/common/README.md) (concrete Gitea page objects, technology-agnostic via `core-page-objects`'s Strategy pattern — one `LoginPage`/`IssuePage`/etc. class runs against either Selenium or Playwright depending on which strategy it's constructed with). Neither `gitea-selenium-vitest` nor `gitea-selenium-cucumber` keeps its own copy of either.
- **[services/gitea-selenium-vitest](services/gitea-selenium-vitest/README.md)** — the original suite: Selenium WebDriver + Vitest, BrowserStack, Allure, multi-account/multi-browser credentials. Full documentation in its own README.
- **[services/gitea-selenium-cucumber](services/gitea-selenium-cucumber/README.md)** — Selenium + Cucumber (BDD/Gherkin). Login, organizations (teams, repositories, and assigning one to the other) and project-board features, tagged `@smoke`/`@e2e`, run across all 3 browsers; still growing.
- **[services/playwright-native](services/playwright-native/README.md)** — Playwright's native test runner, scaffolded and runnable (chrome/firefox/edge, `npm test`), still running only the stock example spec — no Gitea test yet, since that needs `core-page-objects`'s Playwright strategy to be more than a stub.
- **services/playwright-bdd** — reserved for a future Playwright-based BDD suite. Today it's an empty workspace (just a `package.json`), no code or dependencies.

## CI/CD

`.gitea/workflows/` runs on the project's own Gitea instance (self-hosted, GitHub Actions-compatible syntax):

- `ci.yml` — on every push/PR: `npm ci` + `format:check` + `lint` + `typecheck` across the whole monorepo. Never runs real tests, never blocked by external infra.
- `ct.yml` — "Continuous Testing": one job per suite, each deploying its own disposable Gitea, its own Selenium and Healenium's proxy, then running that suite's `npm test`. Manual dispatch + daily weekday cron.
- `bs.yml` — same as `ct.yml` but against BrowserStack (`gitea-selenium-vitest` only). Manual dispatch + weekly cron.

### Which suites `ct.yml` runs

`ct.yml`'s matrix is hardcoded to `gitea-selenium-vitest` and `gitea-selenium-cucumber` — it does not discover suites by scanning for a `test` script. `playwright-native` has one now (it runs the stock Playwright example against playwright.dev, not Gitea) but isn't wired into this workflow; doing so needs both adding it to the matrix/`workflow_dispatch` choices here and installing real browsers on the runner rather than relying on the Selenium grid service this workflow already spins up (Playwright doesn't speak WebDriver, so it can't reuse that container the way the two Selenium suites do). `playwright-bdd` still exposes no `test` script at all.

The cron run covers all of them. A manual dispatch takes a `suite` input to run exactly one; leaving it at `all` runs the lot. Suites run one at a time and a failing suite does not cancel the others, so a red Cucumber run still leaves you the vitest report. Each publishes its own artifact, named `allure-report-<suite>`.

### Healenium

`ct.yml` drives the browser through Healenium's proxy rather than Selenium directly, so a locator whose target has drifted is resolved against the node path recorded for it on an earlier run instead of failing the test.

The proxy and the browser are created per job. The store they consult is not: it runs permanently on the `gitea-lab` VPS, deployed from the `automindai-infra` repository, because a store created per run has no earlier run to compare against and can never heal. The workflow checks that store before any test executes and fails the job if it is unreachable, rather than running green having healed nothing.

Healed locators are debt, not a pass. `ct.yml` is scheduled, never a merge gate; `ci.yml` stays lint, format and typecheck.
