# Tasks

## 1. Give the service the teardown an organization-creating scenario needs

- [x] 1.1 Chain `organizationCleanupFixtures` into `services/playwright-bdd/fixtures/fixture.ts` the way `services/playwright-native/fixtures/fixture.ts` does. Verify with `npm run typecheck -w @gitea-automation/playwright-bdd`, and by running the existing `login` and `create-issue` scenarios on chrome — a fixture no scenario needs must cost them nothing but the client construction.

Typecheck passes and both existing scenarios pass on chrome. The comment in `core/playwright/fixtures/base.fixtures.ts` that said `playwright-bdd` scopes its teardown by tag was no longer true and was corrected.

## 2. Write the feature

- [x] 2.1 Write `services/playwright-bdd/features/scenarios/create-organization.feature`, one scenario tagged `@organization`, covering the thirteen steps of `gitea-selenium-vitest/tests/organizations.test.ts`. Verify `npm run bddgen -w @gitea-automation/playwright-bdd` compiles it, and that every `expect` of the Vitest case appears in some step of the feature or in the definition behind it — none dropped.

`bddgen` compiles it and lists 37 distinct steps. All 40 distinct methods the Vitest case asserts on are asserted by a step definition. The `expect` count is lower, 56 against 99, because the Vitest case repeats the same assertions at every stage and here a parameterised step or a table row covers each repetition.

## 3. Generate the step definitions

- [x] 3.1 Run `playwright-test-generator` over the feature from `tests/seeds/seed.spec.ts`, with `.mcp.json` pointed at this service's config, to emit `features/step-definitions/create-organization.steps.ts`. Record in this file which definitions it wrote and which had to be completed by hand. Verify `bddgen` reports no undefined and no ambiguous step, and that the file has no `test()` and no direct `page` or locator call.

The generator ran without its Playwright tools. `.mcp.json` is read once at session start and the session that delegated the task had started before it existed, so the subagent received only Read, Grep and Glob: it could not drive the browser, call `generator_write_test` or run `bddgen`. It wrote the source from the feature and from `organizations-e2e.spec.ts`, and that source was saved by hand. Nothing was explored in a browser by the agent, which is the difference from the `create-issue` run.

All 37 definitions came from the agent. After review the definitions were reworked by hand, so this is the difference from what the agent wrote: the feature carries bare numbers for counts and the team names as literals, and no step relies on a helper function. Two things were also completed by hand: an unused label parameter on "offers to remove the invited user", which now also asserts the team's name, and an enum-to-string comparison that `no-unsafe-enum-comparison` rejected. `bddgen` reports no undefined and no ambiguous step, and the file has no `test()` and no `page` or locator call. Rerun the generator from a session that has the MCP server loaded to replace the hand-carried source with an explored one.

- [x] 3.2 Run the scenario on chrome, then firefox, then edge. Verify all three pass.

All three pass on the first run, and the whole suite is green on each of them: three scenarios, one worker.

## 4. Prove the cleanup

- [x] 4.1 After a passing run, and after a run forced to fail by inverting one assertion, verify no organization under `test-orgs` survives. Also verify a `test-orgs-*` organization created by hand is swept by the next `@organization` run, and that one outside the prefix is not, which is also what proves the feature's tag reaches `testInfo.tags`.

Nothing under `test-orgs` survived a passing run or a run failing on `Expected: "9"`, `Received: "3"`. A `test-orgs-leftover-*` organization created through the API was gone after the next run, and a `keep-me-*` one was still there. The generated test carries `tag: ['@organization']`. The `at-board-*` organization on the instance was there before this change and belongs to the board scenarios.

## 5. Document and check

- [x] 5.1 Document the feature, its tag and its cleanup in `services/playwright-bdd/README.md`. Verify the file lists the new feature and step file beside the two existing ones.
- [x] 5.2 Run `npm run format:check`, `npm run lint` and `npm run typecheck`, the three checks the pipeline runs, and verify all three pass. `format:check`, not `format`, which rewrites and so always succeeds.

`lint` and `typecheck` pass. `format:check` flags only untracked local output, `blob-report` and `trend-execution`, none of it part of this change.
