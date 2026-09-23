## ADDED Requirements

### Requirement: A spec may generate one test per row of a data table

A visual spec MAY generate more than one test from an array of cases declared at module scope, one `test()` per row, instead of only ever declaring a single test per file. Each generated test SHALL be reported and pass or fail independently of the others. The rows MAY check against one baseline shared across the whole data table, the same way an existing spec MAY check two accounts against one baseline, when the difference between rows is expected to be excluded by a mask; a baseline name used this way SHALL still not collide with any other spec's.

#### Scenario: A data-driven spec runs

- **WHEN** a spec generates its tests from a data table
- **THEN** each row runs as its own test, reported and checked independently of the others

#### Scenario: Rows share one baseline

- **WHEN** every row of a data table is expected to look the same once masked
- **THEN** every row checks against the same baseline name
- **AND** that name does not collide with any other spec's baseline
