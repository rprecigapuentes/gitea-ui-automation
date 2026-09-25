## ADDED Requirements

### Requirement: A Playwright suite is selectable on dispatch and runs after the others

The workflow SHALL run each Playwright suite as its own execution of the Playwright job, one after another and never alongside the Selenium suites. A manual dispatch SHALL be able to name any one Playwright suite, and naming one SHALL NOT run the others.

#### Scenario: Dispatch names the BDD suite

- **WHEN** the workflow is dispatched with a suite selection naming the Playwright BDD suite
- **THEN** only that suite runs, and no Selenium suite or other Playwright suite does

#### Scenario: A scheduled run covers both Playwright suites

- **WHEN** the workflow starts from its schedule
- **THEN** the native Playwright suite runs, and the BDD suite runs after it against its own application under test

### Requirement: The steps of a Playwright suite name the suite

Every step that runs or publishes a Playwright suite SHALL carry the suite's name, so that the log of a run shows which suite each step belongs to.

#### Scenario: Two Playwright suites run in one workflow run

- **WHEN** the native and the BDD suites both run
- **THEN** the step that runs each of them names its suite
- **AND** so do the steps that generate and upload its report

### Requirement: The BDD suite runs its browsers concurrently on CI

The Playwright BDD suite's `test` script SHALL run each supported browser as its own process, all at the same time, so the pipeline's single test command covers the browsers concurrently. Each process SHALL write its own result file.

#### Scenario: The workflow runs the BDD suite

- **WHEN** the workflow runs the BDD suite's `test` script
- **THEN** chrome, firefox and edge run at the same time
- **AND** a failure on any browser fails the script

#### Scenario: The BDD suite publishes its results

- **WHEN** the BDD suite ends, whether it passed or failed
- **THEN** an artifact named for the suite holds its Allure report and one result file per browser
