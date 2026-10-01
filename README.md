# Gitea UI Automation

> Four test suites against [Gitea](https://about.gitea.com/), written on two tools and in two styles,
> sharing one set of page objects. Continuous testing runs them daily, and a red run explains itself.

![Node 22](https://img.shields.io/badge/Node-22-5FA04E?logo=nodedotjs&logoColor=white)
![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Playwright 1.63](https://img.shields.io/badge/Playwright-1.63-2EAD33?logo=playwright&logoColor=white)
![Selenium 4.48](https://img.shields.io/badge/Selenium-4.48-43B02A?logo=selenium&logoColor=white)
![Cucumber 11](https://img.shields.io/badge/Cucumber-11-23D96C?logo=cucumber&logoColor=white)
![Vitest 4](https://img.shields.io/badge/Vitest-4.1-6E9F18?logo=vitest&logoColor=white)

## Contents

- [The suites](#the-suites)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Quality gates](#quality-gates)
- [Continuous testing](#continuous-testing)
- [AI-assisted development](#ai-assisted-development)
- [Repository layout](#repository-layout)
- [Known flaky scenarios](#known-flaky-scenarios)
- [Documentation](#documentation)

## The suites

| Suite                                                                   | Tool               | Style            | Covers                                                       |
| ----------------------------------------------------------------------- | ------------------ | ---------------- | ------------------------------------------------------------ |
| [`gitea-selenium-vitest`](services/gitea-selenium-vitest/README.md)     | Selenium WebDriver | TypeScript tests | organizations, issue metadata, scoped labels; BrowserStack   |
| [`gitea-selenium-cucumber`](services/gitea-selenium-cucumber/README.md) | Selenium WebDriver | Gherkin          | login, organizations, project board, end-to-end demo         |
| [`playwright-native`](services/playwright-native/README.md)             | Playwright         | TypeScript tests | every case above, plus accessibility, visual and performance |
| [`playwright-bdd`](services/playwright-bdd/README.md)                   | Playwright         | Gherkin          | every case above as features; AI failure triage; UI coverage |

Every suite runs on **Chrome, Firefox and Edge**, each browser in its own process with its own Gitea
account. The features both Gherkin suites share are word for word the same.

## Architecture

```
services/*        the suites: specs, steps, fixtures             ← what is tested
   │
business-logic    Gitea: page objects, API clients, scenario state ← written once, shared by all four
   │
core/*            the tools: strategies, driver, logger, config     ← knows nothing about Gitea
```

Dependencies only point down. Three patterns carry it:

- **Strategy.** A page object calls `click`, `findElement`, `isVisible` on an `IInteractionStrategy`.
  Built with the Selenium strategy it drives WebDriver; built with the Playwright one it drives a
  `Page`. The same `LoginPage` serves all four suites.
- **Page objects, fragments and facades.** Selectors live in one `locators` object per class, and no
  spec or step ever sees one. A lint rule enforces it.
- **Fixtures and hooks for state.** Data is created through the API before a test and removed after
  it, pass or fail, so the screen is used only for what is being tested.

See [`core-page-objects`](core/page-objects/README.md) for how waiting works and where the two tools
differ.

## Quick start

**Requirements:** Node 22, Chrome, Firefox and Edge, and a Gitea to test against. Never point the
suites at the instance that hosts this repository: they create and delete users, repositories and
organizations.

```bash
npm install                                     # every workspace, one lockfile
npx playwright install chrome msedge firefox    # browsers for the Playwright suites
```

Each suite reads a `.env` in its own folder; copy its `.env.example` and fill in the accounts.

| Command                                           | Runs                                                  |
| ------------------------------------------------- | ----------------------------------------------------- |
| `npm test`                                        | `gitea-selenium-vitest`, three browsers in parallel   |
| `npm run test:cucumber`                           | `gitea-selenium-cucumber`, three browsers in parallel |
| `npm test -w @gitea-automation/playwright-native` | `playwright-native`                                   |
| `npm test -w @gitea-automation/playwright-bdd`    | `playwright-bdd`                                      |
| `npm run lint` · `format:check` · `typecheck`     | the quality gates, across the whole repository        |

Each suite's README lists its own commands.

## Quality gates

| Gate       | Checks                                                                                                                                       | Runs              |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| ESLint     | type-aware rules, and **no browser call in a spec or step**: `page.locator`, `page.goto`, `page.getBy*`, `driver.findElement`, `driver.wait` | pre-commit and CI |
| Prettier   | formatting                                                                                                                                   | pre-commit and CI |
| TypeScript | `tsc --noEmit` in every workspace                                                                                                            | CI                |

The pre-commit hook (Husky and lint-staged) refuses a commit that breaks a gate.

## Continuous testing

Three workflows in `.gitea/workflows/`, on the repository's own Gitea Actions:

| Workflow                | When                   | Does                                                                           |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `ci.yml`                | every push             | install, format, lint, typecheck; no browser, no Gitea                         |
| `ct-functional.yml`     | daily 11:00, on demand | the four functional suites, each against a disposable Gitea started by the job |
| `ct-non-functional.yml` | daily 13:00, on demand | accessibility, then visual, then performance, one after another                |

The continuous-testing workflows produce evidence and never gate a merge. Each suite publishes its
Allure report, a JUnit file per browser, and the trace and video of a retried test.

**When `playwright-bdd` goes red**, three more steps run while the job's Gitea is still up:

1. **Explain**: a model classifies each failure (`locator`, `timing`, `data`, `environment`,
   `application`) from the failing step and the source lines it names.
2. **File**: one issue per distinct failure on this repository, or a comment on the one already open.
3. **Propose**: for a `locator` failure, an agent reads the live page through the Playwright MCP
   server and proposes the new selector, accepted only if the scenario and the suite then pass.
   Nothing is applied; the run stays red.

## AI-assisted development

| Piece                                    | Where                          | Role                                                               |
| ---------------------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| Playwright planner, generator and healer | `.claude/agents/`              | explore a page, write a test, repair one; taught this architecture |
| Playwright test MCP server               | `.mcp.json`                    | gives the agents a browser, starting from `tests/seeds/`           |
| OpenSpec                                 | `openspec/`, `.claude/skills/` | every change is proposed, applied and archived as a spec           |

`openspec/specs/` holds the requirements of the framework itself, one capability per folder;
`openspec/changes/archive/` holds every change that produced them.

## Repository layout

```
.
├── core/                    tool-level packages (see core/README.md)
├── business-logic/          Gitea page objects, API clients, entities, scenario state
├── services/
│   ├── _shared/playwright/  fixtures both Playwright suites start from
│   ├── gitea-selenium-vitest/
│   ├── gitea-selenium-cucumber/
│   ├── playwright-native/
│   └── playwright-bdd/
├── openspec/                specs and the history of changes
├── .gitea/workflows/        CI and continuous testing
└── .claude/                 agents, skills and commands for AI-assisted work
```

It is an npm workspaces monorepo: one `npm install`, one lockfile, and each package imported by
name, such as `@gitea-automation/business-logic`.

## Known flaky scenarios

These fail intermittently and pass on a re-run. They are recorded so a red run on one is
recognised rather than investigated from scratch.

| Suite                     | Scenario                                                       | Seen                                                 |
| ------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| `gitea-selenium-cucumber` | `project-board.feature`: a column added from the board appears | the column modal's input times out, on Firefox       |
| `playwright-native`       | `demo-e2e.spec.ts`: moving an issue to its board               | fails the first attempt, passes the retry, on Chrome |
| `playwright-native`       | `project-board.spec.ts`: the cards of a deleted column         | fails the first attempt, passes the retry, on Chrome |

## Documentation

| Area           | README                                                                                                                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Core           | [overview](core/README.md) · [page objects](core/page-objects/README.md) · [API client](core/api-client/README.md) · [Selenium](core/selenium/README.md) · [Playwright](core/playwright/README.md) · [config](core/config/README.md) · [data](core/data-handler/README.md) · [logger](core/logger/README.md) |
| Business logic | [business-logic](business-logic/README.md)                                                                                                                                                                                                                                                                   |
| Suites         | [Vitest](services/gitea-selenium-vitest/README.md) · [Cucumber](services/gitea-selenium-cucumber/README.md) · [Playwright native](services/playwright-native/README.md) · [Playwright BDD](services/playwright-bdd/README.md) · [shared fixtures](services/_shared/playwright/README.md)                     |
