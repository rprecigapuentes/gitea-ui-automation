## ADDED Requirements

### Requirement: A spec may generate one test per row of a data table

A visual spec MAY generate more than one test from an array of cases declared at module scope, one `test()` per row, instead of only ever declaring a single test per file. Each generated test SHALL check its own view against its own baseline, named so it cannot collide with any other case's or any other spec's baseline.

#### Scenario: A data-driven spec runs

- **WHEN** a spec generates its tests from a data table
- **THEN** each row runs as its own test, reported and checked independently of the others
- **AND** each row's baseline name is unique across the whole suite
