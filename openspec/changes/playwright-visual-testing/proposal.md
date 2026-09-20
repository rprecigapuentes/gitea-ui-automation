# Proposal

## Why

Visual regression is the second non-functional area the module implements after accessibility, and nothing in the framework compares a rendered page against a recorded one. Playwright's screenshot comparison manages baselines itself, so the suite needs a place for it that does not leak Playwright types into the page objects.

## What Changes

- Add a `VisualTester` in a new `core/playwright` workspace package, with `verifyPage(page, name)` and `verifyComponent(locator, name)`. It sits outside the page-object layer: a page object cannot own a screenshot assertion, because the Selenium strategy has no equivalent.
- Make both checks soft assertions, so a visual mismatch is recorded and the test carries on to its functional steps, and still fails at the end.
- Expose it as a `visualTester` fixture in `fixtures/visual.fixture.ts`, extending the suite fixture the way `axe.fixture.ts` does, so functional tests never load it.
- Add a `visual-chromium` Playwright project on `tests/non-functional/visual/`, with baselines stored per project name, and a first login-page spec.
- Add `test:visual`, which runs only that project and opens the native HTML report when it ends, and `test:visual:update` to record baselines.
- Resolve the owner credentials of a `chromium` project from the Chrome account, since the bundled Chromium has no account of its own.

## Capabilities

### New Capabilities

- `visual-testing`: how a screenshot check is made, how its outcome is recorded, where baselines live and how the suite is run.

### Modified Capabilities

None.

## Impact

- `core/playwright/` (new package), `services/playwright-native/` (fixture, config, spec, baseline, `fixtures/credentials.ts`, `package.json`), `package-lock.json`.

## Out of Scope

- Arguments beyond the page or locator and the baseline name (masking, thresholds, animations): added one at a time as a test needs them.
- Stabilising the login baseline against the Gitea footer's render timings, tracked as its own task.
- Firefox and Edge visual projects, and a CI workflow for the suite.
- Any page beyond the login page, and any change to the Selenium side.
