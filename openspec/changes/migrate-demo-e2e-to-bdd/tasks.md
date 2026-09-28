# Tasks

## 1. Give the generator the world the scenario runs in

- [x] 1.1 Add `services/playwright-bdd/tests/seeds/demo.spec.ts`, declaring
      `seededOrganizationWithRepositories`, `seededMilestone` and `seededUsers`, signed in as the
      owner and left on the organization page. No fixture group has to be added: all three are
      already in this service's chain. Verify it passes under `--project=seeds-chrome`, and that the
      organization and the two users it created are gone afterwards.

The starting state left two seeded users behind, which is how a pre-existing defect surfaced:
`parseBody` in `core/api-client/strategies/playwright-request-strategy.ts` never checks
`response.ok()`, so every API call of the two Playwright suites treats a 4xx as success and returns
`undefined`. Only `at-user-1` leaks, because it is the one that joined a team and Gitea refuses to
delete it while the organization still owns it; the failed delete is swallowed and the run stays
green. The same swallow is why a stale admin token surfaced as a UI timeout rather than a 401. The
`got` strategy the Selenium suites use throws on an error status, so the two differ. Recorded here
and left alone: the fix belongs in its own change, where what it turns red can be seen.

Running the suite measured the cost. Every run leaks exactly one account per browser, never two:
`at-user-1` is the member the scenario adds to the team, Gitea refuses to delete an account the
organization still holds, and the refusal is swallowed. Three runs left three `at-user-1` per
browser and no `at-user-2`. Carrying this case on a third runner multiplies that rate by three.

## 2. Migrate the feature and its step definitions

- [x] 2.1 Copy `demo-e2e.feature` from the Cucumber service. Verify the two files have the same
      checksum, as `login.feature` and `project-board.feature` already do.
- [x] 2.2 Run the Playwright generator over the whole scenario, from the demo starting state, to
      emit `features/step-definitions/demo-e2e.steps.ts` with the thirty-three definitions this
      service does not already have. The twenty-one it does have are not written again. Record here
      which the generator wrote and which had to be completed by hand. Verify `bddgen` reports no
      undefined and no ambiguous step, and that the scenario passes on chrome.

## 3. Prove it across the runners

- [x] 3.1 Run the scenario on chrome, then firefox, then edge. Verify it passes on each, and note
      how long it takes on each — this case is what the four-suite comparison is for.
- [x] 3.2 Run the whole suite on all three browsers and verify `login`, `create-issue` and
      `project-board` still pass, then confirm no `at-board-*` organization and no `at-user-*`
      account survives.
- [x] 3.3 Run `npm run format:check`, `npm run lint` and `npm run typecheck` and verify all three
      pass. `format:check`, not `format`, which rewrites and so always succeeds.

The generator wrote 31 definitions covering all 33 step lines, and redefined none of the 21 this
service already had - the ambiguity this migration most risked. `bddgen` reported neither an
undefined nor an ambiguous step on the first attempt, and the only correction was prettier's line
width. The scenario passed on the first run of each browser: 24.6s on chrome, 27.2s on firefox,
21.0s on edge.

The suite's other failure was not this feature's. The board scenario that reassigns the default
column failed once during a full parallel run and passed on a repeat, which is the race recorded in
`migrate-project-board-to-bdd`, and it is what corrected that note: it is reachable at one worker,
not only at six.
