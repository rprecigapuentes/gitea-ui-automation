## ADDED Requirements

### Requirement: An organization a scenario creates is removed afterwards

The service SHALL remove an organization a scenario created through the browser, together with the
repositories it owns, once the scenario ends, whether it passed or failed. Before a scenario tagged
`@organization` runs, the service SHALL remove the organizations a crashed run left under that
scenario's own name prefix, and SHALL leave every other organization alone.

#### Scenario: A scenario that creates an organization passes

- **WHEN** a scenario creates an organization and ends with every step passing
- **THEN** the organization and its repositories no longer exist on the instance

#### Scenario: A scenario that creates an organization fails

- **WHEN** a scenario creates an organization and a later step fails
- **THEN** the organization and its repositories no longer exist on the instance

#### Scenario: A crashed run left an organization behind

- **WHEN** a scenario tagged `@organization` starts and an organization under its name prefix
  survives from an earlier run
- **THEN** that organization is removed before the scenario's first step

#### Scenario: Another suite's organization exists

- **WHEN** a scenario tagged `@organization` starts and an organization outside its name prefix
  exists
- **THEN** that organization is not removed

#### Scenario: A scenario never touches an organization

- **WHEN** a scenario that creates no organization runs
- **THEN** the teardown finds nothing recorded and removes nothing
