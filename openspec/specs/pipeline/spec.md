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

Every suite SHALL produce a test report and publish it under a name that identifies the suite, whether the suite passed or failed. A functional suite SHALL also produce a machine-readable result file, in a format shared by every functional suite, so that one reader can take the outcome of all of them. When a suite runs its browsers as separate processes, each process SHALL write that file under a name of its own, so that no process overwrites another's results.

#### Scenario: Two suites run in one workflow

- **WHEN** more than one suite runs in a single workflow run
- **THEN** each publishes a separate report artifact
- **AND** no two artifacts share a name

#### Scenario: A suite fails

- **WHEN** a suite's tests fail
- **THEN** its report is still generated and published

#### Scenario: A functional suite finishes

- **WHEN** a functional suite ends, whether it passed or failed
- **THEN** it has written a machine-readable result file
- **AND** that file is published with the suite's report

#### Scenario: A suite runs one process per browser

- **WHEN** a functional suite runs its browsers as concurrent processes
- **THEN** each process writes its own result file
- **AND** every browser's results survive the run

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

A suite whose framework drives a remote browser SHALL address the Selenium server started alongside it in the same job. The job SHALL fail before any test executes when that server does not report itself ready, and the failure SHALL name the component that did not answer. A suite whose framework launches its own browsers is not covered by this requirement.

#### Scenario: A suite starts a session

- **WHEN** a suite whose framework drives a remote browser requests a session
- **THEN** the request is made to the Selenium server running in the same job

#### Scenario: The browser never becomes ready

- **WHEN** the Selenium server does not report itself ready within the job's wait
- **THEN** the job fails before any test executes
- **AND** the failure names the server that did not answer

#### Scenario: A locator no longer matches any element

- **WHEN** a locator fails to match any element
- **THEN** the test fails on that locator
- **AND** no substitute element is resolved on its behalf

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

### Requirement: A job provisions every account and token its suite needs

Each job SHALL create, on its own ephemeral application under test, every Gitea account and API token the suite it runs expects to find already present, and SHALL publish them to the suite. A suite MUST NOT depend on an account or token carried in from outside the run, because the instance it runs against is created fresh for that job and holds nothing from any earlier run.

#### Scenario: A suite expects an account the instance does not have

- **WHEN** a job starts against a freshly created application under test
- **THEN** every account the suite it runs reads from its environment is registered before the suite starts
- **AND** an API token is issued for each account the suite reads a token for
- **AND** each is published to the suite under the name that suite reads

#### Scenario: A suite requires an administrative account

- **WHEN** the suite a job runs performs operations that only an administrator may perform
- **THEN** the job provisions an administrative identity distinct from the accounts its scenarios drive through the browser
- **AND** issues that identity a token carrying administrative privilege
- **AND** the tokens issued to the accounts the scenarios drive do not carry administrative privilege

#### Scenario: A token is issued to an account that turns out not to be privileged

- **WHEN** a job issues a token that claims administrative privilege
- **AND** that token is refused by an operation only an administrator may perform
- **THEN** the job fails at the provisioning step, before the suite starts
- **AND** the failure names the account and the privilege it lacks

#### Scenario: A token reaches the run log

- **WHEN** a job issues any API token
- **THEN** the token's value is masked in the run's output

### Requirement: A measuring suite runs alone on its runner

A suite whose result is a measurement SHALL be the only work of its own executing while it runs. Its workflow SHALL NOT run concurrently with another of its own runs, and the pages it measures SHALL be measured one after another rather than side by side, because work running alongside a measurement changes it and the change cannot be told apart from a regression.

#### Scenario: A measuring workflow is dispatched while one is already running

- **WHEN** a run of the measuring workflow is requested while another is in progress
- **THEN** the two do not measure at the same time

#### Scenario: The suite measures more than one page

- **WHEN** a run measures several pages
- **THEN** they are measured one after another rather than side by side

### Requirement: A measuring workflow publishes its figures and its network recording whether it passed or failed

The workflow of a measuring suite SHALL publish both the figures it produced and the network recording it captured as artifacts of the run, on pass and on fail, so that the reading of a run never depends on repeating it.

#### Scenario: The suite fails

- **WHEN** a measurement falls outside its tolerance and the suite fails
- **THEN** the figures and the network recording are still published

#### Scenario: The suite passes

- **WHEN** every measurement falls inside its tolerance
- **THEN** the figures and the network recording are published all the same

### Requirement: A suite that launches its own browsers runs where those browsers are present

A suite whose framework launches browsers inside the job SHALL run in an environment that already provides them, and every browser its matrix names SHALL be available before any test executes. Where the matrix names a branded browser, the suite SHALL drive that product rather than a substitute engine, so that a result can be attributed to the browser it claims. The job SHALL fail before any test executes when a named browser cannot be provided.

#### Scenario: The suite starts

- **WHEN** the job runs a suite whose framework launches its own browsers
- **THEN** every browser that suite's matrix names is already present in the job
- **AND** no test has executed before that is true

#### Scenario: The matrix names branded browsers

- **WHEN** the suite runs the project it names after a branded browser
- **THEN** that project drives the named product rather than the engine the product is built on
- **AND** two projects naming different products do not resolve to the same binary

#### Scenario: A named browser cannot be provided

- **WHEN** a browser the matrix names cannot be installed or launched in the job
- **THEN** the job fails before any test executes
- **AND** the failure names the browser that is missing

### Requirement: A failing functional test leaves a recording and a trace

A functional suite SHALL retain a recording of the browser and a trace for a test that failed, and SHALL publish both with that run's artifacts. A test that passed SHALL leave neither, so that a run in which nothing failed carries no recording cost. A suite that measures the application under test SHALL retain neither, because recording changes what the measurement reports.

#### Scenario: A functional test fails

- **WHEN** a functional test fails
- **THEN** a recording and a trace of that test are published with the run's artifacts

#### Scenario: Every functional test passes

- **WHEN** a functional run ends with no failure
- **THEN** no recording and no trace are retained

#### Scenario: A measuring suite runs

- **WHEN** the suite that measures the application under test runs
- **THEN** it records neither a video nor a trace, whatever its outcome

### Requirement: A non-functional suite runs as its own job on the workflow reserved for them

Every non-functional suite SHALL run as a job of its own on one workflow that carries only non-functional suites. That workflow SHALL NOT be reachable from the functional suites' run, so neither its duration nor its outcome sits in their path, and SHALL gate no merge. Each job SHALL start its own application under test and publish its own evidence under a name that identifies the suite, whether it passed or failed.

#### Scenario: The functional workflow runs

- **WHEN** the workflow carrying the functional suites runs
- **THEN** no non-functional suite executes
- **AND** its duration is unaffected by them

#### Scenario: The non-functional workflow runs

- **WHEN** the workflow carrying the non-functional suites runs
- **THEN** one job runs per non-functional suite
- **AND** each publishes its evidence under a name of its own

#### Scenario: A non-functional suite fails

- **WHEN** one non-functional job fails
- **THEN** the other non-functional jobs still run
- **AND** no merge is blocked by the failure

### Requirement: No two suites of one workflow run against a runner at a time

A workflow that carries more than one suite SHALL run them one after another, never side by side, because a suite that measures the application under test reports the work running next to it as if it were the application's own. One suite's outcome SHALL NOT cancel the suites that follow it. The suite that measures SHALL run last, so that nothing else occupies the runner while it does.

#### Scenario: A workflow carries more than one suite

- **WHEN** that workflow runs
- **THEN** its suites run one after another
- **AND** a suite's outcome does not cancel the suites that follow it

#### Scenario: The measuring suite's turn comes

- **WHEN** the suite that measures the application under test runs
- **THEN** every other suite on that workflow has already finished
