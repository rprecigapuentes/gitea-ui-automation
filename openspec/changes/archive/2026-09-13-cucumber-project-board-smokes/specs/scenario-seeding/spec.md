## Purpose

Defines how a scenario declares the state it needs before it runs, how the framework puts that state in place and hands it to the scenario's steps, and when that state is removed.

## ADDED Requirements

### Requirement: A scenario declares the state it needs and the framework seeds it before the browser is used

A scenario SHALL declare the state it depends on by tag rather than build that state in its own steps. The framework SHALL create the declared state through the application's API before the scenario's first step runs, so that no step spends interactions putting data in place. A scenario that declares nothing SHALL be given no state.

#### Scenario: A scenario declares seeded state

- **WHEN** a scenario carries the seeding tag
- **THEN** the framework creates the declared state through the API before the scenario's first step runs
- **AND** the first step finds that state already in place

#### Scenario: A scenario declares no seeded state

- **WHEN** a scenario carries no seeding tag
- **THEN** the framework creates no state for it
- **AND** the scenario runs against whatever the instance already holds

### Requirement: Seeded state is named uniquely per scenario

Every entity the framework seeds SHALL carry a name unique to the scenario and to the browser that runs it, so that scenarios executing concurrently against the same instance never read or delete each other's data.

#### Scenario: Two scenarios run concurrently against one instance

- **WHEN** two tagged scenarios are seeded at the same time
- **THEN** each one's entities carry names that do not collide with the other's
- **AND** neither scenario observes the other's state

### Requirement: The steps read seeded state from the scenario's context

The framework SHALL expose the seeded state to every step of the scenario through the scenario's own context rather than through module-level state, and SHALL record for each seeded entity the identifiers a step needs, including identifiers the interface does not display.

#### Scenario: A step needs the identifier of a seeded entity

- **WHEN** a step needs an entity the framework seeded
- **THEN** it reads that entity's identifiers from the scenario context
- **AND** it does not derive them from the screen or from a previous step's side effect

#### Scenario: An identifier is not shown anywhere in the interface

- **WHEN** a step needs an identifier the interface never displays
- **THEN** the scenario context carries the value the framework read from the API response
- **AND** the step does not substitute a different identifier that happens to be visible

### Requirement: Seeded state is removed after the scenario whether it passed or failed

The framework SHALL remove the state it seeded once the scenario ends, including when the scenario failed or a step threw. Where the seeded entities form a tree, removal SHALL follow the order the application requires, deleting the entities the application refuses to cascade before deleting the entity that owns them, and SHALL rely on cascade only where the application actually performs it.

#### Scenario: The scenario fails part way through

- **WHEN** a tagged scenario fails at any step
- **THEN** the framework still removes the state it seeded
- **AND** the instance is left without the scenario's data

#### Scenario: The owning entity cannot be deleted while it still owns others

- **WHEN** the framework removes the state of a finished scenario
- **THEN** it deletes the owned entities the application refuses to cascade first
- **AND** it then deletes the entity that owns them
- **AND** nothing the scenario created is left on the instance

### Requirement: State the seeding API cannot create is created by an explicit step

Where the application exposes no API for a piece of state a scenario needs, the framework SHALL NOT hide its creation in a hook. That state SHALL be created by a step written in the scenario, so that reading the scenario shows every precondition the API could not provide.

#### Scenario: The application exposes no API for a required precondition

- **WHEN** a scenario needs state the seeding API cannot create
- **THEN** that state is created by a step visible in the scenario
- **AND** the hooks seed only the state the API supports
