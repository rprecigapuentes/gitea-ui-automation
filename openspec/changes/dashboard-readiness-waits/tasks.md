## 1. Give the base class the two things the pages need

- [x] 1.1 Add `waitUntil(predicate, timeoutMs)` to `BaseComponent`, the action-free counterpart of `actAndWaitUntil`, resolving to `false` on expiry rather than raising. It does not delegate to `actAndWaitUntil` and `actAndWaitUntil` is left raising: its two call sites await it without reading a result, so making it report would turn their failures silent. Verify with `npm run typecheck`.
- [x] 1.2 Log the failing locator inside `isVisible`'s catch, through the existing pino logger, naming the locator and the browser's current URL. Verify by pointing a scratch check at a locator that does not exist and reading the line in the run output; `openspec/specs/page-objects/spec.md` requires this and the code does not do it today.

## 2. Wait for what the screen is actually doing

- [x] 2.1 Make `LoginPage.login()` wait for the navigation it triggers, through `clickAndWaitForUrl` with a pattern that matches the dashboard and not `/user/login`. Verify that a deliberately wrong password fails inside `login()` naming the URL it waited for, instead of failing later on a dashboard assertion.
- [x] 2.2 Rewrite `MainPage.hasExpectedElementsDisplayed()` to compare its three values inside a `waitUntil` predicate, and to log all three with what they resolved to when the wait expires. Same signature, same three checks, no call site touched. Verify the four call sites still typecheck and that the local suites stay green.
- [x] 2.3 Apply the same predicate wait to `NavBarFragment.isVisibleOnMainPage()`, which has the same read-once shape, keeping its existing log line. Verify the local suites stay green.

## 3. Stop discarding the booleans

- [x] 3.1 Make `NavBarFragment.waitForElements()` resolve to a boolean instead of `Promise<void>`, and make its callers in `login.steps.ts`, `organizations.steps.ts` and `organizations.test.ts` assert on it. The other `waitForElements` results discarded in `organizations.steps.ts` belong to the organization fragments and are left alone; they are the same defect in another owner's code. Verify by reading each call site back: no call to a readiness wait may ignore its result.
- [x] 3.2 Assert the result of `hasExpectedElementsDisplayed()` at `login.steps.ts:14`, where the `Given` step currently computes it and throws it away, so the step passes on a dashboard that never rendered. Verify the scenario now fails at the `Given` rather than three steps later.

## 4. Give AT-ISS-02 back the round trips it wastes

- [ ] 4.1 Return the row from the predicate in `LabelListPage.waitForLabel` instead of re-scanning the list for it. Verify AT-ISS-02 still passes locally and that its `junit.xml` duration drops from the committed 12.8s baseline.
- [ ] 4.2 Do the same in `MilestoneListPage.waitForRow`. Verify AT-ISS-01 still passes locally and its duration drops from the committed 7.6s baseline.
- [ ] 4.3 Make `getChip` reuse the row `waitForLabel` just returned rather than re-enumerating every row and re-reading its six attributes. Verify AT-ISS-02 still passes locally.

## 5. Confirm it in the environment that actually fails

- [ ] 5.1 Run `npm run format`, `npm run lint`, `npm run typecheck`, then both suites locally. Verify all green, knowing local green proves nothing about the race: the dashboard renders in 273ms here.
- [ ] 5.2 Push to `91-ct-admin-token` and read the CT run. Verify `login.feature` passes, the five project-board scenarios execute their steps instead of reporting `0s`, and AT-ISS-02 lands under 30s in all three browsers. If anything is still red, the new log lines name the failing locator and the three compared values, so the next step is reading them rather than guessing.
