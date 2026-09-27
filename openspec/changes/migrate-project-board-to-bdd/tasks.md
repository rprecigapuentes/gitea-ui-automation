# Tasks

## 1. Give the service the fixtures the board scenarios seed from

- [ ] 1.1 Extend `services/playwright-bdd/fixtures/fixture.ts` with `organizationsFixtures` and then
      `projectBoardFixtures`, in that order — the second is typed over `OrganizationsFixtures`, so a
      reversed chain does not compile. Leave `organizationCleanupFixtures` out: both members are
      `auto` and would build the eight API clients for every scenario of the service. Verify with
      `npm run typecheck -w @gitea-automation/playwright-bdd`, and by running the suite's six
      existing tests on all three browsers — a fixture no step declares must cost `login` and
      `create-issue` nothing.
- [ ] 1.2 Replace the comment in that file that predicts these groups "arrive as tag-scoped hooks
      with the first scenario that seeds an organization". The board scenarios seed and tear down
      through the fixture instead. Verify the new text names what is actually true and what a hook
      is still owed to.

## 2. Give the generator a board to wake up in

- [ ] 2.1 Add `services/playwright-bdd/tests/seeds/board.spec.ts` on the two new fixture groups,
      declaring `seededOrganizationWithRepositories` and `kanbanProject` and leaving the browser on
      the board. Widen `tests/seeds/agent-fixtures.ts` to carry the same groups. The basename must
      not contain `seed`: the MCP server finds a starting state by that substring and `seed.spec.ts`
      has to stay the only file that matches. Verify it passes under `--project=seeds-chrome`, and
      that the `at-board-*` organization it created is gone afterwards.

## 3. Migrate the feature and its step definitions

- [ ] 3.1 Copy `project-board.feature` from the Cucumber service into
      `services/playwright-bdd/features/scenarios/`. Verify the two files have the same checksum, as
      the two `login.feature` already do, and that no formatter rewrites `.feature`.
- [ ] 3.2 Run the Playwright generator over the whole feature, from the board starting state, to
      emit `features/step-definitions/project-board.steps.ts`. Record in this file which definitions
      it wrote and which had to be completed by hand. Verify that `bddgen` reports no undefined and
      no ambiguous step, that the generated spec carries a non-empty fixture object on every step,
      and that the five scenarios pass one at a time on chrome.

## 4. Prove it across the runners

- [ ] 4.1 Run the five scenarios on chrome, then firefox, then edge. Firefox is the one that matters:
      `ProjectBoardPage.moveCard` falls back to a synthetic event sequence there because the native
      drag does not reach the server. Verify all five pass on each.
- [ ] 4.2 Run the whole suite on all three browsers and verify `login` and `create-issue` still pass,
      then confirm no `at-board-*` organization survives, after a passing run and after one made to
      fail on purpose.
- [ ] 4.3 Run `npm run format:check`, `npm run lint` and `npm run typecheck`, the three checks the
      pipeline runs, and verify all three pass. `format:check`, not `format`, which rewrites and so
      always succeeds.
