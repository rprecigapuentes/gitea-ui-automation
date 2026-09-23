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

### Requirement: No two suites of one workflow run against a runner at a time

A workflow that carries more than one suite SHALL run them one after another, never side by side, because a suite that measures the application under test reports the work running next to it as if it were the application's own. One suite's outcome SHALL NOT cancel the suites that follow it. The suite that measures SHALL run last, so that nothing else occupies the runner while it does.

#### Scenario: A workflow carries more than one suite

- **WHEN** that workflow runs
- **THEN** its suites run one after another
- **AND** a suite's outcome does not cancel the suites that follow it

#### Scenario: The measuring suite's turn comes

- **WHEN** the suite that measures the application under test runs
- **THEN** every other suite on that workflow has already finished

## REMOVED Requirements

### Requirement: The visual suite runs on its own manually dispatched workflow

**Reason**: Issue #108 puts every non-functional suite on the continuous-testing pipeline as a job of its own. What the requirement protected, that the visual suite never sits in the functional suites' path, is kept by the two requirements added above; what it fixed, one workflow per suite started by hand, is what the issue changes.

**Migration**: The visual suite runs as the `visual` job of the non-functional workflow. It publishes the same artifacts under the same names, so anything reading `playwright-report-visual` or `visual-baselines-linux` is unaffected.
