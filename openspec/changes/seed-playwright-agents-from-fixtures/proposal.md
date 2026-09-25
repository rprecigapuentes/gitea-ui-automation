## Why

The Playwright agents are handed an empty browser, so the generator invents the state its scenario
needs: it writes its own login and hardcodes a repository that only exists because it was seeded by
hand. Issue #125 measured the result. Every spec produced there points at `chrome-owner/agent-baseline`
and would fail in the CT pipeline, which tests a disposable Gitea that holds none of that state.

A rule in the agent's prompt cannot fix this on its own. The agent writes what it saw on screen, and
what it saw was a browser with nothing in it.

## What Changes

- The starting state the agents receive is produced by the suite's own fixtures: signed in as the
  browser's owner, inside a repository the fixture creates and removes.
- A second starting state keeps the signed-out browser available, so a scenario that exercises
  signing in is still generated against an anonymous session.
- Those starting states are held where the suites never execute them, and the files the suites run
  today stay exactly as they are.
- The generator's definition gains one rule: data a fixture owns is read from the fixtures its seed
  declares, never written into the test as a literal.

Out of scope: the planner and healer definitions, beyond the seed a plan names; the behaviour of
Gitea itself, which stays in `.feature` files; regenerating the #125 specs, which are kept as
evidence; and how the suites seed their own state, which does not change.

## Capabilities

### New Capabilities

- `agent-test-generation`: the starting state an agent is given before it drives the browser, and
  what a generated test is required to take from the fixtures rather than invent.

### Modified Capabilities

None. No existing capability describes the agents.

## Impact

- `services/playwright-native/playwright.config.ts`: project selection and which files each project
  collects.
- `services/playwright-native/tests/seed.spec.ts`: replaced by the fixture-backed starting states.
- `.claude/agents/playwright-test-generator.md`: the added rule, in the section this repository
  maintains and re-applies after `npx playwright init-agents`.

No page object, no client, no runtime code and no workflow file changes. The suites' own runs are
unaffected, and nothing here executes in CT.
