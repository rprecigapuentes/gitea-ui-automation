# Spec Delta

## MODIFIED Requirements

### Requirement: Each suite publishes its own report

Every suite SHALL produce a test report and publish it under a name that identifies the suite, whether the suite passed or failed. A functional suite SHALL also produce a machine-readable result file, in a format shared by every functional suite, so that one reader can take the outcome of all of them. That file SHALL name the browser each result came from, either in its own name or on every entry it holds, so that a reader can report one browser's outcome apart from the others'. When a suite runs its browsers as separate processes, each process SHALL write that file under a name of its own, so that no process overwrites another's results.

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

#### Scenario: A reader asks how one browser did

- **WHEN** a reader takes the result files of a run
- **THEN** every result can be attributed to the browser that produced it
- **AND** no two browsers' results are indistinguishable from each other
