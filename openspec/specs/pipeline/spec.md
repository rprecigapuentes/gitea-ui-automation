# pipeline Specification

## Purpose

Defines what the continuous-testing workflow runs, how a single suite is selected for a manual run, how each suite's report is published, and how a suite reaches the browser it drives.

## Requirements

### Requirement: The continuous-testing workflow runs every test-bearing workspace

The workflow SHALL run each service workspace that exposes a `test` script, one independent job per workspace. A workspace with no `test` script SHALL NOT be run.

#### Scenario: A scheduled run covers every suite

- **WHEN** the workflow starts from its schedule
- **THEN** one job runs for each service workspace that exposes a `test` script
- **AND** each job provisions its own application under test and its own browser

#### Scenario: A workspace with no suite is skipped

- **WHEN** a service workspace exposes no `test` script
- **THEN** no job is created for it
- **AND** the absence does not fail the run

### Requirement: A manual run can target one suite

The workflow SHALL accept a suite selection on manual dispatch, and SHALL run every suite when no selection is supplied.

#### Scenario: Dispatch names one suite

- **WHEN** the workflow is dispatched with a suite selection naming a single workspace
- **THEN** only that workspace's job runs

#### Scenario: Dispatch requests every suite

- **WHEN** the workflow is dispatched asking for all suites
- **THEN** one job runs per test-bearing workspace

#### Scenario: A schedule supplies no selection

- **WHEN** the workflow starts from its schedule, which carries no dispatch input
- **THEN** the workflow runs every test-bearing workspace rather than failing on an absent selection

### Requirement: One suite's outcome does not decide another's

Suites SHALL be independent: a failing suite MUST NOT prevent another suite from running or from publishing its results.

#### Scenario: One suite fails and another completes

- **WHEN** one suite's job fails
- **THEN** the remaining suites still run to completion
- **AND** each publishes its own results
- **AND** the workflow as a whole reports failure

### Requirement: Each suite publishes its own report

Every suite SHALL produce a test report and publish it under a name that identifies the suite, whether the suite passed or failed.

#### Scenario: Two suites run in one workflow

- **WHEN** more than one suite runs in a single workflow run
- **THEN** each publishes a separate report artifact
- **AND** no two artifacts share a name

#### Scenario: A suite fails

- **WHEN** a suite's tests fail
- **THEN** its report is still generated and published

### Requirement: A suite's test entry point drives every browser the framework supports

The `test` script of every test-bearing workspace SHALL run the suite on each browser the framework supports, so that the workflow covers the same browsers for every suite without knowing how a suite is organized internally. Every result a suite publishes SHALL name the browser it ran on.

#### Scenario: The workflow runs a suite

- **WHEN** the workflow runs a workspace's `test` script
- **THEN** the suite runs once per supported browser
- **AND** a failure on any browser fails the script

#### Scenario: A scenario ran on three browsers

- **WHEN** the suite's report is generated
- **THEN** each of the three results of a scenario carries the name of its browser
- **AND** a reader can tell which browser a failure belongs to without opening the job log

### Requirement: A suite reaches the browser through the Selenium server its own job starts

A suite SHALL address the Selenium server started alongside it in the same job. The job SHALL fail before any test executes when that server does not report itself ready, and the failure SHALL name the component that did not answer.

#### Scenario: A suite starts a session

- **WHEN** a suite requests a browser session
- **THEN** the request is made to the Selenium server running in the same job

#### Scenario: The browser never becomes ready

- **WHEN** the Selenium server does not report itself ready within the job's wait
- **THEN** the job fails before any test executes
- **AND** the failure names the server that did not answer

#### Scenario: A locator no longer matches any element

- **WHEN** a locator fails to match any element
- **THEN** the test fails on that locator
- **AND** no substitute element is resolved on its behalf
