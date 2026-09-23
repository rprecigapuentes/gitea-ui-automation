# Spec Delta

## ADDED Requirements

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
