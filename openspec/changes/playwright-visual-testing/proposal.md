# Proposal

## Why

Visual regression is the second non-functional area the module implements after accessibility, and nothing in the framework compares a rendered page against a recorded one. Playwright's screenshot comparison manages baselines itself, so the suite needs a place for it that does not leak Playwright types into the page objects.

## What Changes

- Add a `VisualTester` in a new `core/playwright` workspace package, with `verifyPage(page, name)` and `verifyComponent(locator, name)`. It sits outside the page-object layer: a page object cannot own a screenshot assertion, because the Selenium strategy has no equivalent.
- Make both checks soft assertions, so a visual mismatch is recorded and the test carries on to its functional steps, and still fails at the end.
- Expose it as a `visualTester` fixture in `fixtures/visual.fixture.ts`, extending the suite fixture the way `axe.fixture.ts` does, so functional tests never load it.
- Add `visual-chrome`, `visual-firefox` and `visual-edge` Playwright projects on `tests/non-functional/visual/`, derived from the same browser list as the functional projects, with baselines stored per project name, and a first login-page spec.
- Add `test:visual`, which runs each browser in a process of its own with one worker, so a browser's specs run one after another with its account and the browsers run in parallel, and opens a single native HTML report merged from theirs when it ends, `test:visual:update` to record the baselines of all three, and `test:visual:chrome`, `:firefox` and `:edge` to run one browser.
- Store baselines per platform as well as per project, so those recorded on a workstation and those recorded on the workflow's runner coexist.
- Add `.gitea/workflows/visual.yml`, dispatched by hand: it runs the three browsers, publishes the native Playwright report as an artifact, and can record the runner's baselines and publish them for review. A `test:visual:ci` script produces the report without opening it.
- Resolve the owner credentials of a `chromium` project from the Chrome account, since the bundled Chromium has no account of its own. The visual projects no longer need it; it stays for the `accessibility-chromium` projects that resolve through the same function.

## Capabilities

### New Capabilities

- `visual-testing`: how a screenshot check is made, how its outcome is recorded, where baselines live and how the suite is run.

### Modified Capabilities

- `pipeline`: adds the requirements of a visual workflow that runs on its own, publishes the native report and can record baselines.

## Impact

- `core/playwright/` (new package), `services/playwright-native/` (fixture, config, spec, baseline, `fixtures/credentials.ts`, `package.json`), `.gitea/workflows/visual.yml`, `package-lock.json`.

## Out of Scope

- Arguments beyond the page or locator and the baseline name (masking, thresholds, animations): added one at a time as a test needs them.
- Running the visual suite on a schedule or from `ct.yml`: it waits for baselines recorded on the runner and for the volatile regions to settle.
- Committing recorded baselines from the workflow: a person reviews and commits them.
- Any view beyond the login page and the organizations smoke, and any change to the Selenium side.
