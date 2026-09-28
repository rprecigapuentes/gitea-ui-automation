# Tasks

## 1. Give the service the fixtures the board scenarios seed from

- [x] 1.1 Extend `services/playwright-bdd/fixtures/fixture.ts` with `organizationsFixtures` and then
      `projectBoardFixtures`, in that order — the second is typed over `OrganizationsFixtures`, so a
      reversed chain does not compile. Leave `organizationCleanupFixtures` out: both members are
      `auto` and would build the eight API clients for every scenario of the service. Verify with
      `npm run typecheck -w @gitea-automation/playwright-bdd`, and by running the suite's six
      existing tests on all three browsers — a fixture no step declares must cost `login` and
      `create-issue` nothing.
- [x] 1.2 Replace the comment in that file that predicts these groups "arrive as tag-scoped hooks
      with the first scenario that seeds an organization". The board scenarios seed and tear down
      through the fixture instead. Verify the new text names what is actually true and what a hook
      is still owed to.

## 2. Give the generator a board to wake up in

- [x] 2.1 Add `services/playwright-bdd/tests/seeds/board.spec.ts` on the two new fixture groups,
      declaring `seededOrganizationWithRepositories` and `kanbanProject` and leaving the browser on
      the board. Widen `tests/seeds/agent-fixtures.ts` to carry the same groups. The basename must
      not contain `seed`: the MCP server finds a starting state by that substring and `seed.spec.ts`
      has to stay the only file that matches. Verify it passes under `--project=seeds-chrome`, and
      that the `at-board-*` organization it created is gone afterwards.

## 3. Migrate the feature and its step definitions

- [x] 3.1 Copy `project-board.feature` from the Cucumber service into
      `services/playwright-bdd/features/scenarios/`. Verify the two files have the same checksum, as
      the two `login.feature` already do, and that no formatter rewrites `.feature`.
- [x] 3.2 Run the Playwright generator over the whole feature, from the board starting state, to
      emit `features/step-definitions/project-board.steps.ts`. Record in this file which definitions
      it wrote and which had to be completed by hand. Verify that `bddgen` reports no undefined and
      no ambiguous step, that the generated spec carries a non-empty fixture object on every step,
      and that the five scenarios pass one at a time on chrome.

The generator wrote all 23 definitions, and the compilation reported neither an undefined nor an
ambiguous step on the first attempt. Two of them, the `Background` steps that only assert over a
fixture, were declared `async` without awaiting anything and failed `require-await`; dropping
`async` was the whole correction. It also found a trap worth keeping: assigning a project to an
issue commits only when the sidebar combo is closed again, which is what
`SidebarComboFragment.toggleAndWaitForSelection` already does and what driving the board by hand
misses.

## 4. Prove it across the runners

- [x] 4.1 Run the five scenarios on chrome, then firefox, then edge. Firefox is the one that matters:
      `ProjectBoardPage.moveCard` falls back to a synthetic event sequence there because the native
      drag does not reach the server. Verify all five pass on each.
- [x] 4.2 Run the whole suite on all three browsers and verify `login` and `create-issue` still pass,
      then confirm no `at-board-*` organization survives, after a passing run and after one made to
      fail on purpose.
- [x] 4.3 Run `npm run format:check`, `npm run lint` and `npm run typecheck`, the three checks the
      pipeline runs, and verify all three pass. `format:check`, not `format`, which rewrites and so
      always succeeds.

All five pass on chrome, firefox and edge, and the whole suite is green the way the pipeline runs
it: three processes, one worker each. The drag scenario needed no attention on firefox, where the
page object's synthetic-event fallback was the risk.

One race surfaced and is recorded rather than fixed. The scenario that reassigns the default column
fails intermittently with a navigation interrupted by another navigation to the same board:
`makeColumnDefault` returns when the column reads as default, while the reload Gitea started is
still in flight, and the `openFor` that follows collides with it. `playwright-native`'s spec issues
the same two calls in the same order, so the race is the shared page object's and predates this
change.

It reproduces under load, not in isolation: four repeats of the scenario alone pass, while it failed
once at six workers in one process and once at one worker with the three browsers running
concurrently - which is what `test:parallel`, and therefore the pipeline, does. An earlier note here
said no command the project runs reaches it; that was wrong, and the second reproduction is what
corrected it. CI's two retries are what have been absorbing it.

The organization left behind after the runs belonged to the generator's exploration session, whose
starting state stays paused so its teardown never runs, not to a scenario. The suite's own runs left
nothing, on a pass and on a failure forced by inverting an assertion. That places the orphan sweep
where the evidence puts it: agent sessions, not suite runs.
