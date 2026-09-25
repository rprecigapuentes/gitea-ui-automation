## MODIFIED Requirements

### Requirement: A Playwright suite is selectable on dispatch and runs after the others

The workflow SHALL run each Playwright suite in a job of its own, one after another and never alongside the Selenium suites. A manual dispatch SHALL be able to name any one Playwright suite, and naming one SHALL NOT run the others.

#### Scenario: Dispatch names the BDD suite

- **WHEN** the workflow is dispatched with a suite selection naming the Playwright BDD suite
- **THEN** only that suite's job runs, and no Selenium suite or other Playwright suite does

#### Scenario: A scheduled run covers both Playwright suites

- **WHEN** the workflow starts from its schedule
- **THEN** the native Playwright suite's job runs, and the BDD suite's job runs after it against its own application under test

#### Scenario: One Playwright job fails

- **WHEN** the native Playwright suite's job fails
- **THEN** the BDD suite's job still runs, and each publishes its own results
