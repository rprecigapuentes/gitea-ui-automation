# Spec Delta

## ADDED Requirements

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

### Requirement: No two suites run against one runner at a time

The workflows that run suites SHALL be arranged so that at most one suite occupies a runner at any moment, whether the suites belong to the same workflow or to different ones. A run that would overlap another SHALL wait rather than proceed beside it, because a suite that measures the application under test reports the work running next to it as if it were the application's own.

#### Scenario: Two jobs of one workflow could overlap

- **WHEN** a workflow carries more than one suite
- **THEN** its jobs run one after another
- **AND** a job's outcome does not cancel the jobs that follow it

#### Scenario: Two workflows are started close together

- **WHEN** the functional and the non-functional workflows are both triggered
- **THEN** one waits until the other has finished
- **AND** neither run is dropped

## REMOVED Requirements

### Requirement: The visual suite runs on its own manually dispatched workflow

**Reason**: Issue #108 puts every non-functional suite on the continuous-testing pipeline as a job of its own. What the requirement protected, that the visual suite never sits in the functional suites' path, is kept by the two requirements added above; what it fixed, one workflow per suite started by hand, is what the issue changes.

**Migration**: The visual suite runs as the `visual` job of the non-functional workflow. It publishes the same artifacts under the same names, so anything reading `playwright-report-visual` or `visual-baselines-linux` is unaffected.
