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

### Requirement: Suites reach the browser through the healing proxy

A suite SHALL address the browser through Healenium's proxy rather than the Selenium server directly, so that a locator whose target has drifted can be resolved against a stored baseline instead of failing the test.

#### Scenario: A suite starts a session

- **WHEN** a suite requests a browser session
- **THEN** the request is made to the healing proxy
- **AND** the proxy forwards it to the Selenium server that runs in the same job

#### Scenario: A locator no longer matches but a baseline exists

- **WHEN** a locator fails to match any element
- **AND** the healing store holds a node path recorded for that locator on an earlier run
- **THEN** the session continues against the best-scoring candidate
- **AND** the substitution is recorded in the healing store

#### Scenario: The healing path is not available

- **WHEN** the proxy does not become ready, or cannot reach the healing store
- **THEN** the job fails before any test executes
- **AND** the failure names the unreachable component

### Requirement: The healing store outlives the run

The workflow SHALL treat the healing store as an external, persistent service. It MUST NOT create the store as part of a run, because a store created per run holds no baseline from any earlier run and can therefore never heal.

#### Scenario: A run records a baseline

- **WHEN** a suite resolves a locator successfully
- **THEN** the node path it resolved to is written to the external store
- **AND** it remains available to a later, separate workflow run

#### Scenario: The store is unavailable

- **WHEN** the external store cannot be reached at the start of a job
- **THEN** the job fails rather than proceeding with healing silently disabled

### Requirement: A run publishes what the healing proxy did in each of its sessions

For every browser session a suite opens through the healing proxy, the workflow SHALL publish the proxy's log for that session and the store's report for it, as part of the same artifact that carries the suite's report. It SHALL do so whether the suite passed or failed, and SHALL summarize the heals in the run's log so that a reader does not need the artifact to know whether anything was healed. The summary SHALL be derived from the proxy's log, which records every heal, rather than from the store's report, which the proxy leaves empty when it saves a heal without a session key.

#### Scenario: A session healed a locator

- **WHEN** a suite's session resolved at least one locator through a stored baseline
- **THEN** the run's log names, for that session, the locator that failed, the locator it was healed to, and the score of the substitution, read from the proxy's log
- **AND** the artifact holds the proxy's log lines for that session and the store's report for it

#### Scenario: A session healed nothing

- **WHEN** a suite's session resolved every locator directly
- **THEN** the run's log states that the session recorded no heal
- **AND** the artifact still holds the proxy's log lines for that session

#### Scenario: The suite failed before the evidence was collected

- **WHEN** the suite's step fails
- **THEN** the evidence for every session it opened is still collected and published

#### Scenario: The evidence cannot be collected

- **WHEN** the proxy or the store does not answer the request for a session's evidence
- **THEN** the run reports which session's evidence is missing
- **AND** the suite's own outcome decides the job, not the missing evidence

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
