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

### Requirement: The visual workflow can record the baselines its own runner renders

A dispatch of the visual workflow SHALL be able to record baselines instead of comparing against them, and SHALL publish what it recorded as an artifact, since screenshots differ between the platform a person works on and the one the workflow runs on. Recording SHALL NOT commit anything.

#### Scenario: Baselines are recorded

- **WHEN** the workflow is dispatched to record baselines
- **THEN** the suite writes the baselines of every browser
- **AND** they are published as an artifact for a person to review and commit

#### Scenario: A normal dispatch

- **WHEN** the workflow is dispatched without asking to record
- **THEN** the suite compares against the committed baselines and records nothing
