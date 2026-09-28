# Tasks

## 1. Give the generator the world the scenario runs in

- [ ] 1.1 Add `services/playwright-bdd/tests/seeds/demo.spec.ts`, declaring
      `seededOrganizationWithRepositories`, `seededMilestone` and `seededUsers`, signed in as the
      owner and left on the organization page. No fixture group has to be added: all three are
      already in this service's chain. Verify it passes under `--project=seeds-chrome`, and that the
      organization and the two users it created are gone afterwards.

## 2. Migrate the feature and its step definitions

- [ ] 2.1 Copy `demo-e2e.feature` from the Cucumber service. Verify the two files have the same
      checksum, as `login.feature` and `project-board.feature` already do.
- [ ] 2.2 Run the Playwright generator over the whole scenario, from the demo starting state, to
      emit `features/step-definitions/demo-e2e.steps.ts` with the thirty-three definitions this
      service does not already have. The twenty-one it does have are not written again. Record here
      which the generator wrote and which had to be completed by hand. Verify `bddgen` reports no
      undefined and no ambiguous step, and that the scenario passes on chrome.

## 3. Prove it across the runners

- [ ] 3.1 Run the scenario on chrome, then firefox, then edge. Verify it passes on each, and note
      how long it takes on each — this case is what the four-suite comparison is for.
- [ ] 3.2 Run the whole suite on all three browsers and verify `login`, `create-issue` and
      `project-board` still pass, then confirm no `at-board-*` organization and no `at-user-*`
      account survives.
- [ ] 3.3 Run `npm run format:check`, `npm run lint` and `npm run typecheck` and verify all three
      pass. `format:check`, not `format`, which rewrites and so always succeeds.
