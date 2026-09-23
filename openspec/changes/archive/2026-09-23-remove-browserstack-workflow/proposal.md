## Why

BrowserStack is no longer a requirement of this project. `bs.yml` has not been updated since, its weekly cron keeps firing, and it has been failing for long enough that a red run against it carries no information. A workflow that is always red trains everyone to ignore the colour, which costs more than the workflow is worth.

## What Changes

- Remove `.gitea/workflows/bs.yml`.
- Remove the paragraph describing it from the root README and from `services/gitea-selenium-vitest/README.md`.
- **BREAKING**: none. No other workflow depends on it, and nothing reads the `allure-report-browserstack` artifact.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement under `openspec/specs/` mentions BrowserStack: the workflow was never described by a spec, so removing it changes no behaviour any requirement states.

## Impact

`.gitea/workflows/bs.yml`, `README.md`, `services/gitea-selenium-vitest/README.md`. The suite's own BrowserStack support is untouched: `core-selenium`'s `browserstack-config`, the `test:browserstack` script and the credentials they read all stay, so a person can still run against BrowserStack by hand. Only the scheduled workflow goes.

## Out of Scope

- Removing BrowserStack from the framework itself: the driver configuration and the `test:browserstack` script stay, because running against it by hand is still possible and costs nothing to keep.
- The BrowserStack account, its credentials, or any secret stored on the Gitea instance.
- Any other workflow.
