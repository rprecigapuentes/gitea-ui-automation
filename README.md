# Gitea UI Automation — monorepo

An `npm workspaces` monorepo grouping Gitea UI/API automation into several independent projects, each with its own testing tool or style, sharing common code under `core/` and `business-logic/`.

```
/
├── core/                          # organizational only — each subfolder is its own package
│   ├── selenium/                   # @gitea-automation/core-selenium — Selenium driver, drivers/utils/browserstack-config
│   ├── page-objects/                # @gitea-automation/core-page-objects — Strategy pattern: interfaces, Context classes, strategies/, InteractionStrategyFactory
│   ├── api-client/                  # @gitea-automation/core-api-client — same pattern, for Gitea API clients, strategies/, RequestStrategyFactory
│   ├── config/                     # @gitea-automation/core-config — Gitea app config, tool-agnostic
│   ├── data-handler/               # @gitea-automation/core-data-handler — test-data naming, tool-agnostic
│   └── logger/                     # @gitea-automation/core-logger — logging, tool-agnostic
├── business-logic/                # @gitea-automation/business-logic — a single package: clients/, pages/, entities/, state/
├── services/
│   ├── gitea-selenium-vitest/     # Selenium + Vitest — active project, full suite
│   ├── gitea-selenium-cucumber/   # Selenium + Cucumber (BDD) — under construction
│   ├── playwright-native/         # Playwright's native test runner — clients/strategy/pages/scenarioState fixtures, a login-via-API test
│   └── playwright-bdd/            # reserved — no code yet
```

`core/` is **not a workspace itself** — no `package.json` at that level, purely a folder for organizing its subfolder-packages, each of which is. `business-logic/` **is** a workspace — one package, holding everything technology-agnostic that used to be split across two.

## Installation

```bash
npm install
```

Installs the dependencies of every workspace (6 under `core/`, `business-logic` itself, and the 4 services) in one shot.

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

- **[core](core/README.md)** — organizational root for 7 packages: [`core-selenium`](core/selenium/README.md) (Selenium driver + BrowserStack config), [`core-page-objects`](core/page-objects/README.md) (the Strategy pattern for page objects: interfaces, Context classes, `strategies/` for both tools, `InteractionStrategyFactory`), [`core-api-client`](core/api-client/README.md) (the same pattern for Gitea API clients, `RequestStrategyFactory`), [`core-playwright`](core/playwright/README.md) (Playwright-only helpers that sit outside the page-object layer: the `VisualTester`), [`core-config`](core/config/README.md), [`core-data-handler`](core/data-handler/README.md), [`core-logger`](core/logger/README.md) — all tool-and-domain-agnostic except `core-selenium` (and `core-page-objects`/`core-api-client`, deliberately, since those bridge the two tools).
- **[business-logic](business-logic/README.md)** — one package, `@gitea-automation/business-logic`: `clients/` and `entities/` (Gitea API clients, technology-agnostic — every one but `auth.client.ts` runs against either `GotRequestStrategy` or `PlaywrightRequestStrategy`), `state/` (cross-step scenario state), `pages/` (concrete Gitea page objects, technology-agnostic via `core-page-objects`'s Strategy pattern — one `LoginPage`/`IssuePage`/etc. class runs against either Selenium or Playwright depending on which strategy it's constructed with, plus `PageFactory` to assemble them). Used to be two packages split by a technology distinction (`api`/`common`) that no longer applies; none of `gitea-selenium-vitest`, `gitea-selenium-cucumber`, or `playwright-native` keeps its own copy of any of it.
- **[services/gitea-selenium-vitest](services/gitea-selenium-vitest/README.md)** — the original suite: Selenium WebDriver + Vitest, BrowserStack, Allure, multi-account/multi-browser credentials. Full documentation in its own README.
- **[services/gitea-selenium-cucumber](services/gitea-selenium-cucumber/README.md)** — Selenium + Cucumber (BDD/Gherkin). Login, organizations (teams, repositories, and assigning one to the other) and project-board features, tagged `@smoke`/`@e2e`, run across all 3 browsers; still growing.
- **[services/playwright-native](services/playwright-native/README.md)** — Playwright's native test runner (chrome/firefox/edge, `npm test`), now wired to the shared abstractions: `clients`/`strategy`/`pages`/`scenarioState` fixtures and a real login-via-API test (`AuthClient` + `context.addCookies`). A UI-driven test still needs `core-page-objects`'s Playwright strategy to be more than a stub.
- **services/playwright-bdd** — reserved for a future Playwright-based BDD suite. Today it's an empty workspace (just a `package.json`), no code or dependencies.

## CI/CD

`.gitea/workflows/` runs on the project's own Gitea instance (self-hosted, GitHub Actions-compatible syntax):

- `ci.yml` — on every push/PR: `npm ci` + `format:check` + `lint` + `typecheck` across the whole monorepo. Never runs real tests, never blocked by external infra.
- `ct.yml` — "Continuous Testing": two jobs, one per framework, each deploying its own disposable Gitea, then running that framework's suites. Manual dispatch + daily cron.
- `bs.yml` — same as `ct.yml` but against BrowserStack (`gitea-selenium-vitest` only). Manual dispatch + weekly cron.
- `visual.yml` — the `playwright-native` visual suite on Chrome, Firefox and Edge against a disposable Gitea, in two jobs: the first records the baselines the runner lacks (or runs the suite when none is missing), the second compares against them. It publishes `playwright-report-visual`, and `visual-baselines-linux` when it recorded. Push-triggered on its feature branch for now, manual dispatch once merged, and never part of `ct.yml`.
- `accessibility.yml` — the `playwright-native` accessibility scans against a disposable Gitea, publishing `accessibility-scans` (the raw axe JSON plus the Allure report). Manual dispatch only: the scans produce evidence for a person to read, so they stay out of the scheduled run and out of its duration.

### Which suites `ct.yml` runs

`ct.yml`'s matrix is hardcoded to `gitea-selenium-vitest` and `gitea-selenium-cucumber` — it does not discover suites by scanning for a `test` script. `playwright-native` has one now (`example.spec.ts` against playwright.dev, `login-api.spec.ts` against a real Gitea instance) but isn't wired into this workflow; doing so needs both adding it to the matrix/`workflow_dispatch` choices here and installing real browsers on the runner rather than relying on the Selenium grid service this workflow already spins up (Playwright doesn't speak WebDriver, so it can't reuse that container the way the two Selenium suites do). `playwright-bdd` still exposes no `test` script at all.

The cron run covers all of them. A manual dispatch takes a `suite` input to run exactly one; leaving it at `all` runs the lot. Suites run one at a time, and the `playwright` job waits on the `selenium` job so a single VPS never hosts two applications under test at once — but it runs whatever that job's outcome was. A failing suite does not cancel the others, so a red Cucumber run still leaves you the vitest report. Each publishes its own artifact, named `allure-report-<suite>`.

`ct.yml` is scheduled, never a merge gate; `ci.yml` stays lint, format and typecheck.
