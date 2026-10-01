# playwright-bdd

> Gherkin scenarios compiled into Playwright tests, on Chrome, Firefox and Edge, with an AI step in
> the pipeline that explains a red run and proposes the locator to fix.

![Playwright 1.63](https://img.shields.io/badge/Playwright-1.63-2EAD33?logo=playwright&logoColor=white)
![playwright-bdd 9](https://img.shields.io/badge/playwright--bdd-9.2-23D96C?logo=cucumber&logoColor=white)

## Contents

- [Quick start](#quick-start)
- [How it runs](#how-it-runs)
- [The features](#the-features)
- [Tags](#tags)
- [Writing a step](#writing-a-step)
- [When a run goes red](#when-a-run-goes-red)
- [UI coverage](#ui-coverage)
- [Starting states for the Playwright agents](#starting-states-for-the-playwright-agents)
- [Structure](#structure)

## Quick start

```bash
npm install                                    # from the repository root
npx playwright install chrome msedge firefox   # the browsers
cp services/playwright-bdd/.env.example services/playwright-bdd/.env
npm test -w @gitea-automation/playwright-bdd   # the three browsers, then the Allure report
```

| Command                                      | Runs                                                  |
| -------------------------------------------- | ----------------------------------------------------- |
| `npm test`                                   | the three browsers as three processes; what CI runs   |
| `npm run test:chrome` / `:firefox` / `:edge` | one browser                                           |
| `npm run bddgen`                             | compile the features without running them             |
| `npm run report` / `report:open`             | build / open the Allure report                        |
| `npm run explain` · `file-issue` · `heal`    | the pipeline's AI steps, over the last run's results  |
| `npm run ui-coverage:crawl` · `ui-coverage`  | build the UI inventory · measure the suite against it |

Outside CI, every test script ends by building and opening the Allure report, and exits with the
tests' own status.

## How it runs

```
features/*.feature + step-definitions/*.ts  ──bddgen──▶  .features-gen/*.spec.js  ──▶  Playwright
```

**The runner never sees a `.feature`.** `bddgen` compiles each feature and its step definitions into
a Playwright test under `.features-gen/`, which is generated, ignored and never edited. Every test
script runs `bddgen` first; after editing a feature or a step by hand, run `npm run bddgen` before
calling Playwright directly.

Each browser runs in its own process with its own Gitea account, so the three never act as the same
user. A scenario gets 120 seconds, and CI retries a failure twice and keeps its trace and video.

## The features

8 features, 17 scenarios.

| Feature                       | Covers                                                                    | Text shared with Cucumber |
| ----------------------------- | ------------------------------------------------------------------------- | :-----------------------: |
| `login.feature`               | a valid user signs in                                                     |             ✓             |
| `organizations.feature`       | the `@e2e` flow of teams and permissions, and five `@smoke` scenarios     |             ✓             |
| `project-board.feature`       | the Kanban board: template, cards, columns, drag and drop                 |             ✓             |
| `demo-e2e.feature`            | a work item from team assignment to the board that tracks it              |             ✓             |
| `create-organization.feature` | an owner creates an organization and two teams, adds and removes a member |                           |
| `issue-metadata.feature`      | AT-ISS-01: an issue keeps its description, label, milestone and assignee  |                           |
| `scoped-labels.feature`       | AT-ISS-02: a scoped label replaces the label of its own scope             |                           |
| `create-issue.feature`        | an issue with a title and a description (`@skip`: AT-ISS-01 covers it)    |                           |

A feature marked ✓ exists **word for word** in
[`gitea-selenium-cucumber`](../gitea-selenium-cucumber/README.md). Change it here and the other
suite breaks. When a step's wording does not suit this runner, the step definition adapts, never
the feature.

## Tags

| Tag                                                         | Effect                                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| `@smoke`, `@e2e`, `@issues`                                 | scope: select with `--grep`                                            |
| `@skip`                                                     | kept in the feature file, never compiled into a test                   |
| `@team-repository`                                          | seeds an organization with a team and a repository before the scenario |
| `@organization`                                             | sweeps leftovers under the `test-orgs` prefix before the scenario      |
| `@project-board`, `@demo-e2e`, `@organizations`, `@cleanup` | match the Cucumber tags of the shared features                         |

```bash
npx bddgen && npx playwright test --project=chrome --grep @smoke   # from this folder
```

Cleanup does not depend on a tag here: it is an `auto` fixture, so every scenario that created an
organization has it removed afterwards, pass or fail.

## Writing a step

```ts
import { expect, Given, When, Then } from "../../fixtures/fixture";

When("I log in with valid credentials", async ({ pageObjects, ownerCredentials }) => {
  await pageObjects.loginPage.login(ownerCredentials.username, ownerCredentials.password);
});

Then("I should land on the Gitea dashboard", async ({ pageObjects }) => {
  expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
});
```

- **A step only calls page objects.** `page.locator`, `page.goto` and `page.getBy*` in a step fail
  lint: selectors belong to [`business-logic`](../../business-logic/README.md).
- **A step names the fixtures it needs** (`pageObjects`, `clients`, `sessionManager`,
  `scenarioState`, the seeded data); they come from
  [`shared-playwright`](../_shared/playwright/README.md).
- **Values between steps travel through `scenarioState`**, never through a variable in the file. A
  module variable lives as long as the worker, so it would leak into the next scenario that worker
  runs.

## When a run goes red

On a failed CI run, three steps run after the suite, while the job's own Gitea is still serving:

| Step                    | Does                                                                                                                                                             | Output                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Explain** (`explain`) | groups the failures, reads the source lines they name, and asks a model to classify each: `locator`, `timing`, `data`, `environment`, `application` or `unknown` | a table in the run summary, `reports/explanation.json` |
| **File** (`file-issue`) | opens one issue per distinct failure on the repository, or comments on the one already open                                                                      | a Gitea issue                                          |
| **Propose** (`heal`)    | for a `locator` failure, finds the page object that declares the selector, lets an agent read the live page, and checks its answer                               | a row in the run summary, a patch in `reports/`        |

**Nothing is applied.** The job stays red, nothing is committed, and the working tree is put back
whatever happens. A proposal is accepted only when all three gates hold:

1. the change touches nothing outside a page object's `locators` object;
2. the failing scenario passes with it;
3. the suite still passes on that browser, which catches a repair to a fragment several pages share.

The agent drives the browser through the Playwright MCP server with a fixed list of tools. It finds
the element by role and name in the accessibility snapshot, then reads its classes from the DOM,
because the snapshot carries no attributes and a page object holds a CSS string.

Two corpora score these steps against known answers, so a prompt change can be measured rather than
guessed: `tests/failure-corpus/` (six real failures, `npm run explain:score`) and
`tests/heal-corpus/` (deliberately drifted locators, `npm run heal:score`). Both call a model and
are never part of CI.

## UI coverage

How much of Gitea's interface the suite actually exercises, at four levels: URLs, elements, states
and actions.

| Side            | Comes from                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| **Denominator** | a crawl of the running application: every URL it reaches, the interactive elements of each, their states |
| **Numerator**   | the page objects the steps reach, parsed with the TypeScript compiler; no model involved                 |

```bash
npm run ui-coverage:crawl -w @gitea-automation/playwright-bdd   # rebuilds coverage-data/inventory/
npm run ui-coverage -w @gitea-automation/playwright-bdd         # writes coverage-data/reports/coverage.html
```

The inventory is committed and sorted, so two crawls compare with a diff. The figure is a floor:
the crawl reaches only what its seeded data and permissions show it. CI measures it on every
functional run and publishes `ui-coverage-report`.

## Starting states for the Playwright agents

`tests/seeds/` holds the world a Playwright agent starts in. The MCP server runs one to open a
browser and hands the agent the page it was left on.

| File                     | State                                                                        |
| ------------------------ | ---------------------------------------------------------------------------- |
| `seed.spec.ts`           | signed in as the owner, inside a repository the fixtures create: the default |
| `anonymous.spec.ts`      | signed out, on the sign-in form                                              |
| `board.spec.ts`          | the seeded organization, on its Kanban board                                 |
| `demo.spec.ts`           | the seeded organization, its milestone and two users                         |
| `issue-metadata.spec.ts` | a repository with a label and a milestone, on the new issue form             |
| `scoped-labels.spec.ts`  | a repository with one issue, on the label list                               |

They run under the `seeds-chrome` project, which the suite never names. To point the agents at this
service, set the config path in `.mcp.json` and restart the editor:

```json
"args": ["playwright", "run-test-mcp-server", "-c", "services/playwright-bdd/playwright.config.ts"]
```

## Structure

```
services/playwright-bdd/
├── features/
│   ├── scenarios/*.feature          the behaviour, in Gherkin
│   └── step-definitions/*.steps.ts  what each step does
├── fixtures/fixture.ts              the shared fixtures, plus Given / When / Then
├── scripts/                         explain, file-issue, heal, their scorers, ui-coverage/
├── tests/
│   ├── seeds/                       starting states for the agents
│   ├── failure-corpus/              known failures with their right answer
│   └── heal-corpus/                 drifted locators with their right repair
├── coverage-data/                   the UI inventory and the coverage reports
└── .features-gen/                   written by bddgen; never edited, never committed
```

## Configuration

`.env` in this folder, from `.env.example`:

| Variable                              | For                                                  |
| ------------------------------------- | ---------------------------------------------------- |
| `GITEA_BASE_URL`                      | the Gitea under test                                 |
| `GITEA_OWNER_<BROWSER>`, `…_PASSWORD` | one owner account per browser                        |
| `GITEA_INV_<BROWSER>`, `…_PASSWORD`   | one invited account per browser                      |
| `GITEA_TOKEN_<BROWSER>`               | the owner's API token                                |
| `GITEA_ADMIN_TOKEN`                   | an administrator's token, to create the seeded users |
| `OPENAI_API_KEY`                      | only for `explain` and `heal`                        |
