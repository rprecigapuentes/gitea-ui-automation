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

### Requirement: The visual workflow takes the baselines its runner lacks and then compares against them

The visual workflow SHALL run in two jobs. The first SHALL find the views that have no baseline for the platform it runs on and record them, and, when none is missing, SHALL run the suite against the committed baselines itself. The second SHALL run only when the first recorded something, SHALL receive what the first recorded, and SHALL run the suite against it. Nothing SHALL be committed, and no person SHALL need to download or push anything for the second job to run. A dispatch, or a commit that asks for it, SHALL make the first job record every baseline instead of only the missing ones.

#### Scenario: Every view already has a baseline

- **WHEN** the workflow runs and no view lacks a baseline
- **THEN** the first job runs the suite against the committed baselines and publishes its report
- **AND** the second job does not run

#### Scenario: A view was added

- **WHEN** the workflow runs and a view has no baseline for its platform
- **THEN** the first job records that baseline and hands it on
- **AND** the second job runs the suite against the committed baselines and the recorded one and publishes its report

#### Scenario: A person asks to record everything

- **WHEN** the workflow is dispatched to record baselines, or a commit asks for it
- **THEN** the first job records every baseline
- **AND** the second job compares against them

#### Scenario: The first job finds a real mismatch

- **WHEN** no baseline is missing and a view differs from its baseline
- **THEN** the first job fails and publishes its report
