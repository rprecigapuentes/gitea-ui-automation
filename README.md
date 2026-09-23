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

| Script                                               | What it does                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `npm test`                                           | `gitea-selenium-vitest` suite, the 3 browsers as 3 concurrent processes, one JUnit report per browser |
| `npm run test:chrome` / `test:firefox` / `test:edge` | One browser at a time (`gitea-selenium-vitest`)                                                       |
| `npm run test:parallel`                              | The same three, under the explicit name                                                               |
| `npm run test:serial`                                | Same suite, one file at a time                                                                        |
| `npm run test:browserstack`                          | `gitea-selenium-vitest` suite against BrowserStack                                                    |
| `npm run test:cucumber`                              | `gitea-selenium-cucumber` suite, the 3 browsers as 3 concurrent processes (what CT runs)              |
| `npm run test:cucumber:parallel`                     | The same three, under the explicit name                                                               |
| `npm run report` / `report:open`                     | Allure report for `gitea-selenium-vitest`                                                             |
| `npm run lint` / `lint:fix`                          | ESLint across the whole monorepo                                                                      |
| `npm run typecheck`                                  | `tsc --noEmit` in every workspace that defines it                                                     |
| `npm run format` / `format:check`                    | Prettier across the whole monorepo                                                                    |

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
- `ct-functional.yml` — "CT-functional": the functional suites, two jobs, one per framework, each deploying its own disposable Gitea and then running that framework's suites. Each publishes `allure-report-<suite>` with a `junit` file per browser, and the Playwright job also publishes what a failed test's retry left: its video and its trace. Manual dispatch + daily cron.
- `ct-non-functional.yml` — "CT-non-functional": the three suites whose output is read rather than gated, as three jobs chained one after another. `accessibility` publishes `accessibility-scans`, `visual` publishes `playwright-report-visual` and `visual-baselines-linux` when it recorded one, and `performance` publishes `performance-metrics` and `performance-baselines-linux`. Chained rather than parallel because `performance` reports whatever else runs on the VPS as the page's own cost. Manual dispatch + daily cron, two hours after the functional one for that same reason.

### Which suites `ct-functional.yml` runs

The `selenium` job's matrix is hardcoded to `gitea-selenium-vitest` and `gitea-selenium-cucumber`, and the `playwright` job's to `playwright-native` — neither discovers suites by scanning for a `test` script. The two are separate jobs because Playwright does not speak WebDriver, so it cannot reuse the Selenium grid container the first job spins up; it carries its browsers in its own image instead. `playwright-bdd` exposes no `test` script at all and so appears in neither.

The cron run covers all of them. A manual dispatch takes a `suite` input to run exactly one; leaving it at `all` runs the lot. Suites run one at a time, and the `playwright` job waits on the `selenium` job so a single VPS never hosts two applications under test at once — but it runs whatever that job's outcome was. A failing suite does not cancel the others, so a red Cucumber run still leaves you the vitest report. Each publishes its own artifact, named `allure-report-<suite>`.

Both `ct-functional.yml` and `ct-non-functional.yml` are scheduled and dispatched, never a merge gate; `ci.yml` stays lint, format and typecheck. Each keeps a concurrency group of its own, so neither holds the other back, which is why their crons sit two hours apart and why a dispatch of `ct-non-functional.yml` belongs away from the 11:00 one: its `performance` job charges the page it measures for anything else running on the VPS.

## Known flaky scenarios

The project board's column and card interactions fail intermittently in both frameworks, and a
re-run passes. They are not a defect in the application under test and not one this repository has
fixed; they are recorded here so a red run on one of them is recognised rather than investigated
from scratch.

| Suite                     | Scenario                                                               | What is seen                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `gitea-selenium-cucumber` | `project-board.feature`, `A column added from the board appears on it` | `TimeoutError: No visible element(s) for locator "#project-column-title-input"` after the full 5 s wait, on Firefox |
| `playwright-native`       | `demo-e2e.spec.ts`, moving an issue to the board that tracks it        | Fails on the first attempt, passes on the retry, on Chrome                                                          |
| `playwright-native`       | `project-board.spec.ts`, the cards of a deleted column                 | Fails on the first attempt, passes on the retry, on Chrome                                                          |

`ProjectBoardPage.addColumn` clicks the new-column button and then waits for the modal's input,
and the click itself waits for nothing: `BaseComponent` has no primitive that repeats an action
until its effect appears, only `clickAndWaitUntil`, which clicks once and then waits. Raising the
timeout would move the threshold rather than remove the race. The fix is a primitive on
`BaseComponent` that retries the action, which every page would gain, and it needs several runs to
show it worked because the failure is intermittent.

`demo-e2e.feature` drives the same `addColumn`, so a demonstration that includes the project board
is recorded rather than run live.
