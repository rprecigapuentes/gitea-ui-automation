## Why

`services/playwright-native` carries three tests with no counterpart anywhere in the Selenium suites (`gitea-selenium-cucumber`, `gitea-selenium-vitest`): the two `gitea-smoke.spec.ts` cases and `login-api.spec.ts`. That leaves the two frameworks covering different ground, which breaks the port-for-port comparison the Playwright migration is tracking.

## What Changes

- Delete `services/playwright-native/tests/gitea-smoke.spec.ts` (`the instance serves its landing page to an anonymous visitor`, `the sign-up page renders the fields an account needs`) — no Cucumber feature or Vitest test exercises anonymous landing-page or sign-up-form checks.
- Delete `services/playwright-native/tests/login-api.spec.ts` (`logs in and out via session cookies issued by AuthClient`) — an API-level login check; Selenium only exercises login through the UI.
- Leave `non-functional/` (accessibility, visual) untouched: those suites test a different axis than functional parity with Selenium.

**BREAKING**: none — deleting tests only, no framework code changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None: removing tests changes no framework requirement, so `.openspec.yaml` sets `skip_specs: true`.

## Impact

Removed: `services/playwright-native/tests/gitea-smoke.spec.ts`, `services/playwright-native/tests/login-api.spec.ts`. No fixture, page-object, or CI config imports either file — they are self-contained specs. `README.md` describes both under "What's here" / "UI tests"; its text goes stale but is left as-is per the no-docs-unless-asked convention.

## Out of Scope

- Porting the deleted scenarios to Selenium instead of deleting them from Playwright.
- Any change to `non-functional/` (accessibility, visual) specs.
- Reconciling any other coverage gaps beyond these two files.
- Updating `services/playwright-native/README.md`.
