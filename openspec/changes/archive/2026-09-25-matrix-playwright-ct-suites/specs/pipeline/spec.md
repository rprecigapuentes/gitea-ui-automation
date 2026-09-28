## MODIFIED Requirements

### Requirement: The continuous-testing workflow runs every test-bearing workspace

The workflow SHALL run each service workspace that exposes a `test` script, one independent job per workspace. A workspace with no `test` script SHALL NOT be run.

#### Scenario: A scheduled run covers every suite

- **WHEN** the workflow starts from its schedule
- **THEN** every service workspace that exposes a `test` script runs
- **AND** the job that carries it provisions its own application under test and its own browser

#### Scenario: A workspace with no suite is skipped

- **WHEN** a service workspace exposes no `test` script
- **THEN** nothing is run for it
- **AND** the absence does not fail the run

### Requirement: A Playwright suite is selectable on dispatch and runs after the others

The workflow SHALL run each Playwright suite as its own matrix entry of the Playwright job, one after another and never alongside the Selenium suites, each against its own application under test. A manual dispatch SHALL be able to name any one Playwright suite, and naming one SHALL NOT run the others.

#### Scenario: Dispatch names the BDD suite

- **WHEN** the workflow is dispatched with a suite selection naming the Playwright BDD suite
- **THEN** only that suite's entry runs, and no Selenium suite or other Playwright suite does

#### Scenario: A scheduled run covers both Playwright suites

- **WHEN** the workflow starts from its schedule
- **THEN** the native Playwright suite runs, and the BDD suite runs after it against its own application under test

#### Scenario: One Playwright job fails

- **WHEN** the native Playwright suite's entry fails, even by hanging or crashing before its teardown
- **THEN** the BDD suite's entry still runs on a fresh application under test, and each publishes its own results

#### Scenario: Provisioning fails

- **WHEN** the application under test or its accounts could not be provisioned for one entry
- **THEN** that entry runs no suite, and the other entry is unaffected
