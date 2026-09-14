## 1. Make a red run readable

- [x] 1.1 Log the failing locator and the browser's URL inside `isVisible`'s catch, which collapsed timeout, invalid CSS, stale element and "found N elements" into one mute false. An absence check (`timeoutMs` 0) logs at debug; anything else warns. Verified: `page-objects/spec.md` already required this, and the local Cucumber run now prints `Locator absent` lines naming each locator.
- [x] 1.2 Log the caught error and the URL in `hasExpectedElementsDisplayed()` and `isVisibleOnMainPage()` instead of returning a bare false. Verified by reading both back: no path returns false without a line saying why.
- [x] 1.3 Retry a stale element, and Chrome's "node does not belong to the document" variant, inside `findElements`' poll instead of letting it escape the wait. A wait meant to tolerate a settling page died the moment the page settled. Verified: `checkOnce` returns null on those and keeps polling.

## 2. Make the clock measure time

- [x] 2.1 Drop the driver's implicit wait from 3000 to 0. Verified locally over the full Vitest suite: 12/12 pass and total run time falls from 218.9s to 81.4s, AT-ISS-02 from 13.6s to 7.4s, AT-ISS-01 from 7.9s to 4.8s. Its own commit, so it reverts alone.
- [x] 2.2 Confirm nothing was living on the implicit wait. Cucumber locally: 11/12. The one failure, `addRepository`, was then tested with the implicit wait restored and broke 1 of 3 there too, so it is pre-existing and stays out of this change. Reported rather than fixed quietly: it arrived from main today and belongs to its author.

## 3. Undo what was calibrated against the broken clock

- [x] 3.1 Revert `hasExpectedElementsDisplayed()` to the single read that passed in #280 (chrome 4045ms, firefox 5957ms), dropping the retry loop and the 20s budget that made all three fail at ~23s in #289. Verified: the four call sites are untouched and the local suites pass.
- [x] 3.2 Revert `isVisibleOnMainPage()` the same way, keeping its existing log line.
- [x] 3.3 Drop `BaseComponent.waitUntil`. Reverting the loops leaves it with no callers, and main removed it in `7f07f99`; reintroducing it under the same name with a different signature would undo that refactor without discussing it. Verified: no references remain outside the unrelated `waitUntilDisplayed`/`waitUntilTeamDisplayed`.
- [ ] 3.4 Bring `testTimeout` back down from 60000 once the CT run says what these tests cost without the implicit wait. Marked provisional in the config comment so it is not mistaken for a measured value.

## 4. Keep the fixes that were never in question

- [x] 4.1 `LoginPage.login()` waits for the navigation it triggers, through `clickAndWaitForUrl` with a pattern matching the dashboard and not `/user/login`.
- [x] 4.2 `NavBarFragment.waitForElements()` resolves to a boolean and its callers assert on it, including the step main added today that also discarded it.

## 5. Read the environment that actually fails

- [ ] 5.1 Push to `91-ct-admin-token` and read the CT run. The criterion is not that it passes: it is that the log names the error the dashboard read is throwing. If it still fails, the next step is reading that line, not proposing a fourth theory.
- [ ] 5.2 Compare all twelve durations against #289. They should fall in a block. One that becomes unstable instead of faster was living on the implicit wait and needs its own explicit one.
- [ ] 5.3 Before the PR, remove the temporary push trigger (task 3.3 of `ct-admin-token`).
