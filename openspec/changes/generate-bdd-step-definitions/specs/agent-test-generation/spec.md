## ADDED Requirements

### Requirement: What an agent emits is decided by the suite it is writing for

A suite that runs Gherkin SHALL receive a step-definition file, and a suite that runs specs SHALL receive a spec. The feature file of a Gherkin suite SHALL be the specification the agent is given, and SHALL NOT be edited by the agent, because its text may be shared with another runner where a change to it breaks a second suite.

#### Scenario: The target suite runs Gherkin

- **WHEN** an agent is asked to write a test for a suite whose behaviour is held in feature files
- **THEN** it emits definitions for the steps of the named feature
- **AND** it emits no test declaration of its own

#### Scenario: The target suite runs specs

- **WHEN** an agent is asked to write a test for a suite that holds its behaviour in specs
- **THEN** it emits a spec

#### Scenario: The wording of a step does not fit the code

- **WHEN** an agent finds a step whose wording it would rather express differently
- **THEN** the feature is left as it is
- **AND** the definition is written to the wording the feature already uses

### Requirement: A step definition resolves exactly one step and carries no state of its own

Each step of a feature SHALL be resolved by exactly one definition. A value produced by one step and read by another SHALL travel through the scenario's own state rather than through a variable held in the file, because the definitions of one file serve every scenario that uses them and those scenarios run in parallel.

#### Scenario: Two definitions match one step

- **WHEN** a step of a feature is matched by more than one definition
- **THEN** the run reports it rather than choosing one
- **AND** the duplicate is removed in favour of the definition that already existed

#### Scenario: No definition matches a step

- **WHEN** a step of a feature is matched by no definition
- **THEN** the run reports that step as undefined
- **AND** the definition is corrected to the feature's wording

#### Scenario: A later step needs what an earlier one produced

- **WHEN** a step needs a value an earlier step of the same scenario produced
- **THEN** it reads that value from the scenario's state
- **AND** two scenarios running at once never observe each other's values

### Requirement: Generated Gherkin tests are compiled before they are run or repaired

Where a suite compiles its runnable tests from features and step definitions, that compilation SHALL run after any edit to either and before the tests are executed or handed to a repairing agent. A repairing agent SHALL NOT be given a build that predates the edit under investigation.

#### Scenario: A feature or a definition is edited

- **WHEN** either file changes
- **THEN** the runnable tests are regenerated before the next run
- **AND** the run exercises the edited version

#### Scenario: A generated test fails and is handed over for repair

- **WHEN** a failing test of such a suite is handed to a repairing agent
- **THEN** the tests it runs were compiled from the current feature and definitions
- **AND** the failure it diagnoses is the one the current files produce
