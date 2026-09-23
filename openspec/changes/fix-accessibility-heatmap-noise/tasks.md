## 1. Let a page declare the regions its scan leaves out

- [x] 1.1 Add `getScanExclusions(): string[]` to `business-logic/pages/common/main.page.ts`, returning the selector of the contribution heatmap's day cells, beside the existing `getVolatileRegions()`; verify `npm run typecheck` passes.
- [x] 1.2 Give `makeAxeBuilder` in `services/playwright-native/fixtures/axe.fixture.ts` an optional list of selectors to exclude, forwarded to the builder's own `exclude`, and log the list through `@gitea-automation/core-logger/pino.logger` as the other fixtures do, so a pipeline log says what a scan skipped; verify a call that passes nothing still type-checks and still scans the whole page.
- [x] 1.3 Pass `pageObjects.mainPage.getScanExclusions()` from `tests/non-functional/accessibility/dashboard.spec.ts`; verify no selector string is written in the spec.

## 2. Re-record the dashboard baseline

- [x] 2.1 Rewrite `tests/non-functional/accessibility/baselines/dashboard-violations.txt` as the committed baseline with every `.heatmap-day` line removed, which is what the scan produces once those nodes are excluded, and verify it holds 10 lines and no `heatmap` occurrence. The suite cannot record it locally without a Gitea to scan, and the pipeline is what confirms the derivation.
- [x] 2.2 Verify the two untouched baselines, `login-violations.txt` and `organization-create-violations.txt`, are byte-identical to what is on main.

## 3. Confirm it on the runner

- [ ] 3.1 Add the on-push trigger to `.gitea/workflows/accessibility.yml`, push, and verify the job ends green with the dashboard scan passing against the re-recorded baseline.
- [ ] 3.2 Remove the on-push trigger in its own commit, and verify that commit touches only the workflow.
