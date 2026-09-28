## Why

`playwright-bdd` now runs the login scenario and reports through Allure, but the continuous-testing workflow still runs only `playwright-native`. The workflow file itself notes that `playwright-bdd` joins the Playwright job once it exposes a test script, and it now does. `playwright-native` also runs its three browsers in one process with a single worker on CI, so the pipeline has no suite that actually runs its browsers at once.

## What Changes

- The Playwright job's matrix runs `playwright-native` and then `playwright-bdd`, one after the other on the same VPS, each with its own Gitea and its own accounts.
- A manual dispatch can name `playwright-bdd`, and a dispatch naming one Playwright suite runs only that one.
- The steps that run and publish a Playwright suite carry its name (`Run the suite (playwright-bdd)`), so the log shows which suite a step belongs to.
- Each suite publishes its own `allure-report-<suite>` artifact, with its JUnit files and `test-results`.
- `playwright-bdd`'s `test` script runs the three browsers as three concurrent processes, one worker each, as `gitea-selenium-cucumber` does. The pipeline runs `npm test` unchanged and the browsers do run at once.

## Capabilities

### Modified Capabilities

- `pipeline`: a Playwright suite is selectable on dispatch, its steps name it, and the BDD suite's browsers run concurrently on CI.

## Impact

Modified: `.gitea/workflows/ct-functional.yml` and `services/playwright-bdd/package.json`.

## Out of Scope

- Making `playwright-native` run its browsers concurrently on CI: it is left as it is.
- The non-functional workflow, and the Selenium job's step names.
- More than one worker per browser: a browser's account is shared by every scenario it runs.
- Documentation of the pipeline.
