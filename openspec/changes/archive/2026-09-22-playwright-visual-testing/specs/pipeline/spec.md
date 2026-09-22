# Spec Delta

## ADDED Requirements

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

The visual workflow SHALL run in one job that compares the suite against the committed baselines by default. A dispatch, or a commit that asks for it, SHALL make it record every baseline instead of comparing. Whatever the run recorded SHALL be uploaded as an artifact for a person to download and commit; nothing is committed by the workflow itself.

#### Scenario: A normal run

- **WHEN** the workflow runs without asking to record baselines
- **THEN** the job compares the suite against the committed baselines and publishes its report

#### Scenario: A person asks to record baselines

- **WHEN** the workflow is dispatched to record baselines, or a commit asks for it
- **THEN** the job records every baseline instead of comparing
- **AND** the recorded baselines are uploaded as an artifact for a person to commit
