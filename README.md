# Gitea UI Automation — monorepo

An `npm workspaces` monorepo grouping Gitea UI/API automation into several independent projects, each with its own testing tool or style, sharing common code in `core/` and `business-logic/`.

```
/
├── core/                          # shared package: tool-agnostic + Selenium automation framework
├── business-logic/                # shared package: concrete Gitea page objects + API clients/entities
├── services/
│   ├── gitea-selenium-vitest/     # Selenium + Vitest — active project, full suite
│   ├── gitea-selenium-cucumber/   # Selenium + Cucumber (BDD) — under construction
│   ├── playwright-native/         # reserved — no code yet
│   └── playwright-bdd/            # reserved — no code yet
```

## Installation

```bash
npm install
```

Installs the dependencies of every workspace (`core`, `business-logic`, and the 4 services) in one shot.

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

- **[core](core/README.md)** — tool-and-domain-agnostic foundation, plus the Selenium browser-automation primitives (driver factory, base pages).
- **[business-logic](business-logic/README.md)** — concrete Gitea page objects (Page/Fragment/Facade) and API clients/entities, shared by every Selenium-based service below. Neither `gitea-selenium-vitest` nor `gitea-selenium-cucumber` keeps its own copy.
- **[services/gitea-selenium-vitest](services/gitea-selenium-vitest/README.md)** — the original suite: Selenium WebDriver + Vitest, BrowserStack, Allure, multi-account/multi-browser credentials. Full documentation in its own README.
- **[services/gitea-selenium-cucumber](services/gitea-selenium-cucumber/README.md)** — Selenium + Cucumber (BDD/Gherkin). Scaffold with a working login feature, run across all 3 browsers; under construction.
- **services/playwright-native** and **services/playwright-bdd** — reserved for future Playwright-based automation. Today they're empty workspaces (just a `package.json`), no code or dependencies.

## CI/CD

`.gitea/workflows/` runs on the project's own Gitea instance (self-hosted, GitHub Actions-compatible syntax):

- `ci.yml` — on every push/PR: `npm ci` + `format:check` + `lint` + `typecheck` across the whole monorepo. Never runs real tests, never blocked by external infra.
- `ct.yml` — "Continuous Testing": deploys a disposable Gitea + Selenium and runs the `gitea-selenium-vitest` suite (plain `npm test`, the single-process 3-browser run) against them. Manual dispatch + daily weekday cron.
- `bs.yml` — same as `ct.yml` but against BrowserStack (`gitea-selenium-vitest` only). Manual dispatch + weekly cron.

Both pipelines stay on `gitea-selenium-vitest` with its normal (non-`:parallel`) scripts for now — `gitea-selenium-cucumber` isn't wired into CI yet.
