## Purpose

Defines what a Cucumber tag guarantees about the data a tagged scenario creates, and how a tag can be used to select which scenarios a run executes.

## ADDED Requirements

### Requirement: A tagged scenario's created data is torn down after the scenario, regardless of outcome

A scenario carrying a tag that creates data through the API or through the UI SHALL have that data torn down once the scenario ends, whether every step passed or a step failed partway through. Teardown SHALL NOT run only on success.

#### Scenario: Every step passes

- **WHEN** a tagged scenario completes with every step passing
- **THEN** the data that scenario created is torn down before the run moves on

#### Scenario: A step fails after the data was created

- **WHEN** a tagged scenario creates data and a later step then fails
- **THEN** the data already created is still torn down

#### Scenario: A scenario ends before creating any data

- **WHEN** a tagged scenario fails before it creates any data
- **THEN** no teardown of that data is attempted

### Requirement: A teardown failure is reported without masking the scenario's own outcome

If tearing down a tagged scenario's data itself fails, that failure SHALL be reported (so leftover data is not silent) but SHALL NOT replace or hide the scenario's own pass/fail result.

#### Scenario: Teardown itself fails

- **WHEN** a tagged scenario passes (or fails) and the subsequent teardown of its data fails
- **THEN** the scenario's own result is reported as it was
- **AND** the teardown failure is reported separately, identifying the data that was not removed

### Requirement: A tag selects which scenarios a run executes

A test run SHALL be able to execute only the scenarios carrying a given tag, in addition to the default of running every scenario when no tag is given.

#### Scenario: A run is invoked with a tag

- **WHEN** a run is invoked naming one tag
- **THEN** only scenarios carrying that tag execute

#### Scenario: A run is invoked with no tag

- **WHEN** a run is invoked with no tag named
- **THEN** every scenario executes, as before this capability existed

#### Scenario: A tag-scoped run still exercises every configured browser

- **WHEN** a tag-scoped run is invoked in its multi-browser form
- **THEN** the tagged scenarios execute against every configured browser, each independently
