# Tasks

## 1. Give the service the fixtures the scenario seeds from

- [x] 1.1 Chain `organizationsFixtures` into `services/playwright-bdd/fixtures/fixture.ts`, as its own `.extend()` group beside the organization cleanup one. Verify with `npm run typecheck -w @gitea-automation/playwright-bdd`.

Typecheck passes.

## 2. Copy the feature

- [x] 2.1 Copy the `@e2e` scenario of `services/gitea-selenium-cucumber/features/scenarios/organizations.feature`, with its Feature header, into `services/playwright-bdd/features/scenarios/organizations.feature`. Verify the copied lines are byte-identical to the source (`diff`), and that the five `@smoke` scenarios are not present.

`diff` against the first 87 lines of the source reports no difference; the `@smoke` scenarios past that point are absent from the copy.

## 3. Write the step definitions

- [x] 3.1 Write `services/playwright-bdd/features/step-definitions/organizations.steps.ts`, one definition per distinct step text of the scenario, following the page-object sequence `organizations-e2e.spec.ts`'s "Change team members permissions" test already proves. Verify `npm run bddgen -w @gitea-automation/playwright-bdd` reports no undefined and no ambiguous step.

`bddgen` compiled the feature with no undefined and no ambiguous step on the first attempt.

- [x] 3.2 Run the scenario on chrome, then firefox, then edge. Verify all three pass.

All three passed on the first run.

## 4. Prove it alongside the rest of the suite

- [x] 4.1 Run the whole `playwright-bdd` suite (login, create-issue, create-organization, organizations) on chrome, firefox and edge. Verify all twelve pass.

12/12, one worker per browser as the pipeline runs it.

- [x] 4.2 Run `npm run format:check`, `npm run lint` and `npm run typecheck`. Verify all three pass.

`lint` and `typecheck` pass. `format:check` flags only untracked local run output (`blob-report`, `trend-execution`), none of it part of this change.

Also found, not fixed here (see design.md — Risks): a passing chrome or edge run leaves an
`at-user-1-<browser>-*` account behind; firefox does not, and `at-user-2-*` is never left behind.
The same pattern exists on the instance from `playwright-native`'s own runs of the same fixture,
predating this change. Flagged for a separate fix.

## 5. Document

- [x] 5.1 Document the feature in `services/playwright-bdd/README.md`, beside the other three.
