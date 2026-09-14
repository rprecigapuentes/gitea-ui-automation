## Purpose

Defines what a Cucumber scenario can assume when it stops acting as the account it started with and continues as another account the run provisioned, so that one scenario can verify what two different users see of the same state.

## ADDED Requirements

### Requirement: A scenario continues as another provisioned user without the login form

The framework SHALL let a step hand the browser the session of another account the run provisioned, obtaining that session through the application's API rather than by driving the login form. Every step after it SHALL act as that account until the scenario ends. The login form SHALL remain the subject of the scenarios that are about logging in, and SHALL NOT become the cost every multi-user scenario pays.

#### Scenario: A step continues as another provisioned user

- **WHEN** a step asks to continue as one of the run's provisioned users
- **THEN** the browser is left authenticated as that user
- **AND** every later step of the scenario acts as that user

#### Scenario: The scenario was already authenticated

- **WHEN** a step asks to continue as another user while the browser holds a session
- **THEN** the previous session is cleared before the new one is installed
- **AND** no step afterwards acts as the previous user

### Requirement: A switch that does not take fails the step that asked for it

A session switch that cannot be completed SHALL fail the step, naming the account it was asked to become. The framework SHALL NOT leave the browser on the previous account and let the scenario continue, because the assertions that follow a switch are about what that account may and may not do, and the previous account would answer them with a different and possibly passing result.

#### Scenario: The session cannot be obtained

- **WHEN** the session of the requested account cannot be obtained or installed
- **THEN** the step fails, naming that account
- **AND** no later step runs against the previous account

### Requirement: A switched session does not outlive its scenario

The account a scenario switches to SHALL NOT still be the browser's account when the next scenario begins. The next scenario SHALL start from the same authentication state it would have started from had the switch never happened.

#### Scenario: The next scenario begins

- **WHEN** a scenario that switched accounts ends, whether it passed or failed
- **THEN** the next scenario does not inherit that account's session
