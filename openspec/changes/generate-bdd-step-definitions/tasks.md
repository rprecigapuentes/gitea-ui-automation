## 1. Give playwright-bdd the starting states its agents wake up in

- [x] 1.1 Add a `seeds-chrome` project to `services/playwright-bdd/playwright.config.ts`, listed
      first and not a `defineBddProject`, with `testDir: "."` bounded by
      `testMatch: "tests/seeds/*.spec.ts"` — the server refuses to write a generated file outside
      every project's `testDir`, and a step definition belongs in `features/step-definitions/`.
      Verify with `npx playwright test --list --project=chrome`, which must show only the generated
      feature specs, and `--project=seeds-chrome`, which must show only the starting states.
- [x] 1.2 Add `services/playwright-bdd/tests/seeds/seed.spec.ts` on the shared fixtures, signed in
      through `sessionManager.loginAsOwner()` and declaring `owner` and `repository`. Verify it
      passes under `--project=seeds-chrome` and that the repository it created is gone afterwards.
- [x] 1.3 Add `services/playwright-bdd/tests/seeds/anonymous.spec.ts`, signed out on the sign-in
      page. Verify it passes, and that `seed.spec.ts` is the only file in that directory whose name
      contains `seed` — the server finds a starting state by that substring.
- [x] 1.4 Verify `npm run bddgen` still succeeds with a project in the config it did not generate.

## 2. Teach the generator what a step definition is

- [x] 2.1 Add to the repository's own section of `.claude/agents/playwright-test-generator.md` that
      the target path decides the shape, and what a step definition is: the feature is read and
      never edited, `Given`/`When`/`Then`/`expect` come from the service's fixtures, no `test()` or
      `test.describe()`, one definition per distinct step text matching the feature exactly, and
      cross-step values travel through `scenarioState`. Verify the rule sits in the maintained
      section, not in the stock text above it.

## 3. Teach the apply stage the compile step

- [x] 3.1 Add to the `## Local addition` of `.claude/skills/openspec-apply-change/SKILL.md` that a
      `playwright-bdd` task writes or copies the feature first, that `bddgen` runs after any edit to
      a feature or a step file and before the healer is handed anything, and that an undefined or
      ambiguous step is corrected rather than healed. Verify the sentence names the command.

## 4. Prove it

- [x] 4.1 Establish whether `generator_write_test` can write a step definition at all. Read from
      `node_modules/playwright/lib/mcp/test/generatorTools.js`: it writes the agent's text verbatim
      without inspecting it, and refuses only a path outside every project's `testDir`. Task 1.1
      resolves the path half; nothing in the tool objects to the content.
- [x] 4.2 Run the generator against a `playwright-bdd` scenario end to end and verify the emitted
      file is a step-definition file that passes after `bddgen`. Run against `create-issue.feature`
      with `.mcp.json` pointed at this service's config: `generator_write_test` took
      `features/step-definitions/create-issue.steps.ts` on the first try, and the file it wrote has
      no `test()`, imports from `../../fixtures/fixture`, and carries one definition per step text.
      `bddgen` compiled all seven with none undefined or ambiguous, and the scenario passes on
      chrome, firefox and edge. The run also found the gap task 2.1 could not:
      `ScenarioState.createdIssue` had no `description`, so the generator obeyed both the feature
      and the `scenarioState` rule through a local cast. `business-logic/state/scenario.entity.ts`
      gained the field and the step file dropped the cast.
- [x] 4.3 Run `npm run format:check`, `npm run lint` and `npm run typecheck`, the three checks the
      pipeline runs, and verify all three pass. `format:check`, not `format`, which rewrites and so
      always succeeds — and prettier is not idempotent on a list item holding two paragraphs, so a
      file it just wrote can still fail the check.
- [x] 4.4 Rewrite `services/playwright-bdd/README.md`, which still described the workspace as not
      started, and record there how to point the agents at this service.
