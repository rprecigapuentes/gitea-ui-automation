## Why

The dashboard check has failed on four straight CT runs and two attempts to fix it made it worse, because the failure could not be read. `hasExpectedElementsDisplayed()` returned a bare `false` for four different reasons and logged none, so all-three-false could not be told apart from "a read threw and we discarded why". #287 read that as a budget problem and raised the settle wait to 20s; #289 returned the identical line after 20s of retrying, and `login.test.ts` went from passing at 4s to failing at 23s.

Underneath it, a 3000ms implicit wait made every budget meaningless. Selenium documents that mixing the two produces unpredictable timeouts, and `findElements` blocks for its full duration before returning an empty list (SeleniumHQ/selenium#12278): every absence check paid 3s, and every failed poll inside an explicit wait paid it again.

## What Changes

- The implicit wait drops to 0. `BaseComponent` already polls explicitly. Measured locally: the Vitest suite falls from 218.9s to 81.4s, AT-ISS-02 from 13.6s to 7.4s.
- `hasExpectedElementsDisplayed()` returns to the single read it had before this branch, which passed, and logs what it caught and the URL instead of discarding it. Same for `isVisibleOnMainPage()`.
- `isVisible` logs the locator it failed on and the page it was on, which `page-objects/spec.md` already required.
- `findElements` treats a stale element inside its poll as not-ready-yet instead of letting it escape the wait.
- `LoginPage.login()` waits for the navigation it triggers rather than returning at the click.
- Readiness waits stop discarding their booleans: `waitForElements()` reports, and its callers assert.

### Out of scope

- **The settle loop and the 20s budget.** Reverted, not tuned: built on the misread log.
- **`testTimeout: 60000`.** A ceiling until the next CT run measures the real cost without the implicit wait, then brought down to what that says.
- **`FIND_ELEMENTS_AUTO_HEALING`.** Healenium does not heal `findElements` unless the backend sets it, and `BaseComponent` routes every lookup through `findElements`: CI pays a proxy hop for healing that never engages, and hard-fails the job on a store it never uses. A decision for both owners.
- **`SpecificTeamFragment.addRepository`.** Flaky 1 in 3 with and without the implicit wait: pre-existing, not exposed here.

## Capabilities

### Modified Capabilities

- `page-objects`: a check reports why it failed, and waits are explicit rather than implicit.

## Impact

`driver.factory.ts`, `base-component.ts`, `main.page.ts`, `nav-bar.fragment.ts`, `login.page.ts`, and the Cucumber login steps. Affects both suites.
