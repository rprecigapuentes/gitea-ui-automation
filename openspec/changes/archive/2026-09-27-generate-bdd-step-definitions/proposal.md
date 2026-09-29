## Why

The test cases move from `playwright-native` to `playwright-bdd`, and they are meant to be written
by the Playwright agents rather than by hand. Two things stop that today.

The agents would wake up in a blank browser. `playwright-bdd`'s config defines no starting state,
so the MCP server writes an empty `seed.spec.ts` and hands over an anonymous session — the failure
`seed-playwright-agents-from-fixtures` closed for the other suite, reproduced here.

And the generator only knows how to emit a spec. A BDD suite runs no spec anyone writes: the
behaviour is Gherkin, the code is a step-definition file, and the runner sees only what `bddgen`
compiles from the two. A generator told to "write the test" writes the wrong artifact.

## What Changes

- `playwright-bdd` gains the two starting states the other suite already has, built on the shared
  fixtures: signed in as the browser's owner inside a repository the fixtures create and remove,
  and a signed-out one for a scenario whose subject is signing in.
- They run under a project of their own, which is not a BDD project, because the server runs a
  starting state through the runner before any feature exists for it.
- The generator's definition learns that the target path decides the shape of what it emits, and
  what a step definition is: the feature is the specification and is not edited, the imports come
  from the service's fixtures, there is no `test()`, and step text matches the feature exactly.
- The apply stage learns to run `bddgen` after any edit to a feature or a step file and before the
  healer is handed anything, and learns that an undefined or ambiguous step is not a locator
  problem and so not the healer's to fix.

Out of scope: the features themselves and their step definitions, which are the migration and come
one change at a time; tag-scoped seeding, which arrives with the first scenario that needs it; the
planner and healer definitions; and `playwright-native`, which does not change.

## Capabilities

### Modified Capabilities

- `agent-test-generation`: what an agent emits when the suite it is writing for runs Gherkin, and
  what has to happen between writing that file and running it.

## Impact

- `services/playwright-bdd/playwright.config.ts`: one project added.
- `services/playwright-bdd/tests/seeds/`: new.
- `.claude/agents/playwright-test-generator.md` and `.claude/skills/openspec-apply-change/SKILL.md`:
  the sections this repository maintains and re-applies after the generators rewrite those files.

No page object, no client and no workflow file changes. The suites' own runs are unaffected.
