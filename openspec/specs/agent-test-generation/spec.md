# agent-test-generation Specification

## Purpose

Defines the state a test-generating agent is given before it drives the browser, where those starting states live so the suites never execute them, and what a generated test is required to take from the fixtures rather than read off the screen.

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
