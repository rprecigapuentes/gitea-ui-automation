# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
