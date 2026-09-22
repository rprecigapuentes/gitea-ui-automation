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

### Requirement: The visual suite runs on its own manually dispatched workflow

The visual suite SHALL run from a workflow of its own, started by hand, and SHALL NOT be reachable from any workspace default `test` entry point or from the continuous-testing workflow, so that neither its duration nor its outcome sits in the path of the functional suites. The workflow SHALL start its own application under test and SHALL sign in with one account per browser it runs.

#### Scenario: The continuous-testing workflow runs

- **WHEN** the continuous-testing workflow runs a workspace `test` script
- **THEN** no visual spec executes

#### Scenario: The visual workflow is dispatched

- **WHEN** its own workflow is dispatched by hand
- **THEN** only the visual suite runs, on every browser it defines
- **AND** each browser signs in with an account of its own

### Requirement: The visual workflow publishes the native report whether it passed or failed

The visual workflow SHALL publish the native Playwright report as an artifact when the suite ends, whether it passed or failed, so that a mismatch can be read as the expected, actual and diff images without re-running it. Producing the report SHALL NOT wait for a person to open it.

#### Scenario: A comparison fails

- **WHEN** a visual check fails in the workflow
- **THEN** the native report is still published
- **AND** it shows the expected, actual and diff images of the failing check

#### Scenario: Every comparison passes

- **WHEN** the suite passes
- **THEN** the native report is still published

### Requirement: The visual workflow compares against committed baselines and lets a person record new ones by hand

The visual workflow SHALL run in one job that compares the suite against the committed baselines by default. A dispatch, or a commit that asks for it, SHALL make it record every baseline instead of comparing. Whatever the run recorded SHALL be uploaded as an artifact for a person to download and commit; nothing is committed by the workflow itself. When the run compares (it was not asked to record) and a baseline was auto-created because it was missing, the job SHALL fail and name the baseline(s) that were created, even though the individual check that created it reports as passed, so a missing baseline cannot pass unnoticed.

#### Scenario: A normal run

- **WHEN** the workflow runs without asking to record baselines
- **THEN** the job compares the suite against the committed baselines and publishes its report

#### Scenario: A person asks to record baselines

- **WHEN** the workflow is dispatched to record baselines, or a commit asks for it
- **THEN** the job records every baseline instead of comparing
- **AND** the recorded baselines are uploaded as an artifact for a person to commit

#### Scenario: A baseline is missing during a comparing run

- **WHEN** the workflow compares (it was not asked to record) and a view has no committed baseline
- **THEN** the job fails
- **AND** the failure names the baseline that was auto-created
- **AND** the recorded baseline is still uploaded as an artifact for a person to commit
