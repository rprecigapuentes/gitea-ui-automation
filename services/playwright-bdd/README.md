# playwright-bdd

The Gherkin suite that runs on Playwright. Scenarios live in `.feature` files,
[`playwright-bdd`](https://github.com/vitalets/playwright-bdd) compiles them together with the step
definitions into Playwright tests, and the Playwright runner executes those.

```
services/playwright-bdd/
├── features/
│   ├── scenarios/*.feature          # the behaviour, in Gherkin
│   └── step-definitions/*.steps.ts  # what each step does
├── fixtures/fixture.ts              # the shared fixtures, plus Given/When/Then
├── tests/seeds/                     # the starting states the Playwright agents are handed
└── .features-gen/                   # written by bddgen, never edited, never committed
```

## Running it

```bash
cp .env.example .env                              # then fill it in
npm test -w @gitea-automation/playwright-bdd      # the three browsers at once
npm run test:chrome -w @gitea-automation/playwright-bdd
```

Every test script runs `bddgen` first. **The runner never sees a `.feature`**: it runs what
`bddgen` wrote into `.features-gen/`, so after editing a feature or a step definition by hand, run
`npm run bddgen -w @gitea-automation/playwright-bdd` before running the tests directly.

## How a step reaches the browser

Through the page objects in [`@gitea-automation/business-logic`](../../business-logic/README.md),
the same ones the Selenium services use, built here over `InteractionStrategyFactory.playwright`.
A step definition that calls `page` or a locator is a review blocker — `openspec/config.yaml` says
so, and `openspec/specs/playwright-bdd/spec.md` repeats it for this service.

```ts
import { Given, When, Then, expect } from "../../fixtures/fixture";

Given("I am on the Gitea login page", async ({ pageObjects }) => {
  await pageObjects.loginPage.open();
});
```

The fixtures a step destructures come from
[`services/_shared/playwright`](../_shared/playwright/README.md), shared with `playwright-native`:
`pageObjects`, `clients`, `sessionManager`, `scenarioState`. A value one step produces and another
reads travels through `scenarioState`, never through a variable in the file — the definitions serve
every scenario that uses them, and those run in parallel.

Feature text that also exists in the Selenium Cucumber service is **identical on both sides**, by
requirement. Change it here and the other suite breaks.

## The features

| Feature                       | Case                                                                           | Shared with Cucumber |
| ----------------------------- | ------------------------------------------------------------------------------ | -------------------- |
| `login.feature`               | a valid user signs in                                                          | yes                  |
| `create-issue.feature`        | an issue is created with a title and a description                             | no                   |
| `create-organization.feature` | an owner creates an organization and two teams, then adds and removes a member | no                   |
| `organizations.feature`       | the `@e2e` scenario and the five `@smoke` scenarios of the Cucumber feature    | yes (all of it)      |
| `project-board.feature`       | the five Kanban board scenarios                                                | yes                  |
| `demo-e2e.feature`            | the work item that travels from a team to the board that tracks it             | yes                  |
| `issue-metadata.feature`      | AT-ISS-01: an issue keeps its description, label, milestone and assignee       | no                   |
| `scoped-labels.feature`       | AT-ISS-02: a scoped label replaces the label of its own scope                  | no                   |

`create-organization.feature` is the Vitest case "should create an organization and add members",
which `playwright-native` also carries. It keeps every assertion of that case, and the Cucumber
service has no feature for it, so the Gherkin is authored here.

`issue-metadata.feature` and `scoped-labels.feature` are the Vitest cases AT-ISS-01 and AT-ISS-02,
which `playwright-native` carries as `issue-metadata.spec.ts` and `scoped-labels.spec.ts`. The
Cucumber service has no issue feature either, so their Gherkin is authored here too, from the
assertions those cases make. Both are tagged `@issues`. `create-issue.feature` is tagged `@skip`
because AT-ISS-01 covers it and more; it stays on disk, and `issue-metadata.feature` resolves four
of its steps to the definitions that file still owns.

`organizations.feature` is byte-identical to the Cucumber service's own `organizations.feature`, in
full: the `@e2e` scenario and every `@smoke`. "Add a repository to a team" is tagged
`@team-repository`; a `Before` hook scoped to that tag seeds `scenarioState` from
`seededOrganizationWithTeamAndRepository` before its first step, mirroring Cucumber's own
tag-scoped `Before` hook without adding that seeding cost to any other scenario of this feature.

## Scenarios that create an organization

Tag the feature `@organization`. The scenario records what it creates in `scenarioState`, and two
fixtures chained in `fixtures/fixture.ts`, the same ones `playwright-native` chains, do the rest:

- After the scenario, passed or failed, the organization and its repositories are removed.
- Before a scenario carrying the tag, organizations a crashed run left under the `test-orgs` prefix
  are removed. Nothing outside that prefix is touched, so parallel workers and other suites are safe.

Both are `auto`, so they run for every scenario, and a scenario that creates no organization finds
nothing recorded and removes nothing.

## When a locator drifts

A red run in continuous testing explains itself: `npm run explain` classifies each failure, and when
the answer is `locator`, `npm run heal` says which one to change.

It never changes it. The run's outcome stays the failure the suite reported, nothing is committed,
and the working tree is put back whatever happens — which is the distance between this and the
WebDriver proxy it replaces, and why `openspec/specs/pipeline/spec.md` still requires that a locator
matching nothing fails its test.

What it does, in order:

1. Keeps the failures classified `locator` above low confidence, and traces the selector each one
   names to the page object that declares it. That is a search, not a question for a model: page
   objects hold their selectors as literals in one `locators` object.
2. Hands an agent the page through the Playwright MCP server, with the tools it may call enumerated.
   It finds the element by role and accessible name in the snapshot, then reads its classes from the
   DOM: the snapshot is the accessibility tree and carries no attributes, and a page object holds a
   CSS string.
3. Accepts what comes back only if all three hold: the diff touches nothing outside a `locators`
   object, the failing scenario passes, and the suite still passes on that browser. The third is the
   one that catches a repair to a fragment several pages share.
4. Writes the file, the key, both selectors and what was re-run to the run's step summary, and the
   patch to `reports/`.

A repair that fails any gate is reported with the reason rather than dropped.

## The starting states, for the Playwright agents

`tests/seeds/` holds the world an agent wakes up in. The MCP server runs one of these to open a
browser and hands the agent the page it was left on, so an empty one means the agent invents the
state its scenario needs and writes that invention into the test.

| File                     | State                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `seed.spec.ts`           | signed in as the browser's owner, inside a repository the fixtures create and remove — the default |
| `anonymous.spec.ts`      | signed out, on the sign-in form; named by path when signing in is the scenario's subject           |
| `board.spec.ts`          | the seeded organization and its repositories, on the Kanban project's board                        |
| `demo.spec.ts`           | the seeded organization, its milestone and the two seeded users, on the organization page          |
| `issue-metadata.spec.ts` | a repository carrying the classification label and the milestone, on the new issue form            |
| `scoped-labels.spec.ts`  | a repository carrying one seeded issue, on the label list                                          |

They run under the `seeds-chrome` project, which the suite's own runs never name. Its `testDir` is
the service root with an explicit `testMatch`, because the MCP server refuses to write a generated
file outside every project's `testDir`, and a step definition belongs in `features/step-definitions/`.

To point the agents at this service rather than at `playwright-native`, change the config path in
your `.mcp.json` and restart the editor — it is read once, at session start:

```json
"args": ["playwright", "run-test-mcp-server", "-c", "services/playwright-bdd/playwright.config.ts"]
```
