# Spec Delta

## ADDED Requirements

### Requirement: A suite that produces evidence runs on its own manually dispatched workflow

A suite whose purpose is to produce evidence for a person to read, rather than to gate a change, SHALL run from a workflow of its own, started by hand. It SHALL NOT run from any workspace default `test` entry point, and SHALL NOT be reachable from the continuous-testing workflow, so that neither its duration nor its outcome sits in the path of the functional suites. It SHALL publish its evidence as an artifact whether it passed or failed.

#### Scenario: The continuous-testing workflow runs

- **WHEN** the continuous-testing workflow runs a workspace `test` script
- **THEN** no evidence-producing suite executes

#### Scenario: The evidence-producing suite is dispatched

- **WHEN** its own workflow is dispatched by hand
- **THEN** only that suite runs
- **AND** its evidence is published as an artifact

#### Scenario: The evidence-producing suite fails

- **WHEN** the suite fails
- **THEN** its evidence is still published
- **AND** no other workflow reports a failure because of it
