## Context

See proposal.md - Why. What shapes this design is what was ruled out by measurement rather than argued.

**The DOM was never the problem.** Probed against the instance under test (Gitea 1.27.3, the same version `ct.yml` pins, confirmed through `GET /api/v1/version`): a user created seconds earlier, with no repositories and no organizations, renders the dashboard tabs as `[{class "item active", text "Repository"}, {class "item", text "Organization"}]`, and `.text [class=gt-ellipsis]` resolves to exactly one visible element whether the context dropdown is open or closed. `gt-ellipsis` is current on this version; there is no `tw-ellipsis` on the page. The dashboard is fully rendered 273ms after the login click.

**The log was the problem.** Every value the check compared was correct, and when a read raised, the reason was deleted by a bare `catch`. Three CI runs were diagnosed from a line that could not distinguish "the tabs said no" from "we threw the reason away".

**The clock was also lying.** With a 3000ms implicit wait in force, a 20s settle budget bought roughly six attempts, not hundreds.

## Goals / Non-Goals

**Goals:**

- Make a red run readable from its own output.
- Make a configured timeout correspond to time actually spent.
- Return the dashboard check to the shape that demonstrably passed, minus the blindness.

**Non-Goals:**

- Guessing at the CI-only failure. This change is what makes the next run answer it.
- Tuning budgets. Every number here either goes back to what it was or is marked provisional pending measurement.

## Decisions

**Remove the implicit wait rather than work around it.** Two changes in a row were calibrated against a clock that did not measure time, and both failed. Selenium's own documentation says not to mix the two; SeleniumHQ/selenium#12278 documents that `findElements` blocks for the full implicit duration before returning an empty list, which is precisely what an absence check and a failing poll do. The local measurement settles it: the Vitest suite drops from 218.9s to 81.4s and every test gets faster, with 12/12 still passing. It is its own commit so it reverts alone.

**Revert the settle loop instead of tuning it.** `hasExpectedElementsDisplayed()` had a single read with default waits, and `login.test.ts` passed at 4045ms on chrome and 5957ms on firefox in #280. Replacing it with a retry loop of `INSTANT` reads made all three fail at ~23s in #289, because under the implicit wait an `INSTANT` read is not instant. Keeping the loop and shortening it would be a third calibration against the same broken clock.

**Log inside the catch rather than propagating.** Letting the read raise would surface the cause, but `page-objects/spec.md` requires this predicate to report rather than raise, and its four call sites are written as `expect(...).toBe(true)`. Logging the caught error and the URL keeps the contract and supplies the missing fact.

**Leave `SpecificTeamFragment.addRepository` alone.** Removing the implicit wait was the obvious suspect for its 1-in-3 failure, so it was tested both ways: broken 1 of 2 with the implicit wait at 0, and broken 1 of 3 with it back at 3000. Pre-existing, in a scenario that arrived from main today, and not this change's to fix quietly.

## Risks / Trade-offs

- **[Risk]** Dropping the implicit wait can expose waits elsewhere that were living on it without their authors knowing, in either owner's code. → Mitigated by measurement rather than hope: both suites run locally, and the CT run compares all twelve durations against #289. A test that becomes unstable instead of faster is one of these, and needs its own explicit wait.
- **[Risk]** The fix is verified on a machine where the CI failure does not reproduce; the dashboard renders here in 273ms. → Accepted and stated: local green proves only that nothing broke. The new log lines are what the next CT run is for.
- **[Trade-off]** `isVisible` now logs on every miss, including the deliberate absence checks that expect to miss. → Those pass `timeoutMs` 0 and log at debug; a real miss warns.
- **[Risk]** `testTimeout` stays at 60000, which hides how long these tests really take. → Marked provisional in the config comment, with the next CT run named as what brings it back down.
