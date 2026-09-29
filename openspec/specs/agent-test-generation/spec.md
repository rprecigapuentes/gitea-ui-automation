# agent-test-generation Specification

## Purpose

Defines the state a test-generating agent is given before it drives the browser, where those starting states live so the suites never execute them, what a generated test is required to take from the fixtures rather than read off the screen, and which artifact an agent emits for the suite it is writing for.

## Requirements

### Requirement: An agent is given its starting state by the same fixtures the suites use

The state an agent finds in the browser SHALL be created by the fixtures the suites already run, and SHALL be removed by them once the agent's session ends. No state an agent depends on SHALL be put in place by hand, and none SHALL be expected to already exist on the instance.

#### Scenario: An agent begins a session

- **WHEN** an agent asks for a browser for a scenario
- **THEN** the state it finds was created by the fixtures the suites use
- **AND** the entities carry names unique to that session

#### Scenario: The agent's session ends

- **WHEN** the agent finishes with the browser
- **THEN** the fixtures remove the state they created
- **AND** the instance is left without it

#### Scenario: The instance holds nothing the scenario needs

- **WHEN** an agent is pointed at an instance that was created empty
- **THEN** it is still given the state its scenario requires
- **AND** no step of generating the test depends on data seeded outside the fixtures

### Requirement: More than one starting state is offered and a plan names the one it used

The framework SHALL offer a starting state for a signed-in session inside a repository the fixtures own, and a starting state for a signed-out session. A test plan SHALL record which starting state its scenario was explored from, and a generated test SHALL name the same one.

#### Scenario: A scenario exercises signing in

- **WHEN** a scenario's subject is the sign-in journey itself
- **THEN** it is explored from the signed-out starting state
- **AND** the browser carries no session

#### Scenario: A scenario begins after signing in

- **WHEN** a scenario's subject is anything the framework reaches while signed in
- **THEN** it is explored from the signed-in starting state, already inside a repository the fixtures own
- **AND** the generated test establishes that session through the framework's session manager, not by driving the sign-in form

#### Scenario: A scenario names no starting state

- **WHEN** neither a plan nor an agent names a starting state
- **THEN** the signed-in starting state is the one used
- **AND** no empty starting state is created to stand in for it

### Requirement: The suites never execute a starting state, and the agents always can

A starting state SHALL be defined where the suites do not collect it, so that a suite run produces no result for one and creates none of its data. The agents SHALL still be able to run it, so excluding a starting state from the suites SHALL NOT make it unreachable to them.

#### Scenario: A suite runs

- **WHEN** any of the functional or non-functional suites runs
- **THEN** no starting state is executed
- **AND** the run's report holds no result for one

#### Scenario: An agent runs a starting state

- **WHEN** an agent asks for the browser a starting state prepares
- **THEN** that starting state runs
- **AND** the agent is handed the browser with the state in place

#### Scenario: An agent names no starting state file

- **WHEN** an agent asks for a browser without naming a starting state file
- **THEN** it is given the one the framework defines as the default
- **AND** no empty starting state file is written into the suite's directories

### Requirement: A generated test reads fixture-owned data from the fixtures

A generated test SHALL obtain every value a fixture owns, including the owner and the repository it acts on, by declaring that fixture rather than by writing into the test an identifier observed on screen. Credentials SHALL be resolved as the suites resolve them, per browser, and SHALL NOT appear in a generated test as a literal.

#### Scenario: A test needs the repository its scenario acted on

- **WHEN** a generated test refers to the owner or the repository
- **THEN** it takes both from the fixtures its starting state declares
- **AND** neither appears in the file as a literal name

#### Scenario: The agent observed an identifier on screen

- **WHEN** an identifier the agent read from the browser belongs to a fixture
- **THEN** the generated test declares the fixture and reads the value from it
- **AND** the observed value is not written into the test

#### Scenario: A test runs against a different browser project

- **WHEN** a generated test runs under a browser other than the one it was generated on
- **THEN** it resolves that browser's own account
- **AND** no account name or password is written into the file

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
