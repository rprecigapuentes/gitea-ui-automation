## ADDED Requirements

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
