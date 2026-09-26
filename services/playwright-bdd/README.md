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
[`core/playwright/fixtures`](../../core/playwright/README.md), shared with `playwright-native`:
`pageObjects`, `clients`, `sessionManager`, `scenarioState`. A value one step produces and another
reads travels through `scenarioState`, never through a variable in the file — the definitions serve
every scenario that uses them, and those run in parallel.

Feature text that also exists in the Selenium Cucumber service is **identical on both sides**, by
requirement. Change it here and the other suite breaks.

## The starting states, for the Playwright agents

`tests/seeds/` holds the world an agent wakes up in. The MCP server runs one of these to open a
browser and hands the agent the page it was left on, so an empty one means the agent invents the
state its scenario needs and writes that invention into the test.

| File                | State                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `seed.spec.ts`      | signed in as the browser's owner, inside a repository the fixtures create and remove — the default |
| `anonymous.spec.ts` | signed out, on the sign-in form; named by path when signing in is the scenario's subject           |

They run under the `seeds-chrome` project, which the suite's own runs never name. Its `testDir` is
the service root with an explicit `testMatch`, because the MCP server refuses to write a generated
file outside every project's `testDir`, and a step definition belongs in `features/step-definitions/`.

To point the agents at this service rather than at `playwright-native`, change the config path in
your `.mcp.json` and restart the editor — it is read once, at session start:

```json
"args": ["playwright", "run-test-mcp-server", "-c", "services/playwright-bdd/playwright.config.ts"]
```
