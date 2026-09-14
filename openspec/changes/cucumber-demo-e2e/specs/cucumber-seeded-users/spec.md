## MODIFIED Requirements

### Requirement: A run provisions its own extra users for the whole run

A Cucumber run SHALL create its own Gitea user accounts, beyond the fixed owner account, once before any scenario runs, and SHALL make each one's credentials available to any scenario in that run. It SHALL also make available, for each provisioned user, the identifier the application assigned it, so that a scenario can act on controls that address a user by identifier rather than by name.

#### Scenario: A run starts

- **WHEN** a Cucumber run begins
- **THEN** its own Gitea user accounts exist before the first scenario's steps run

#### Scenario: A scenario needs one of the run's own users

- **WHEN** a scenario asks for one of the run's provisioned users
- **THEN** it receives that user's username and password

#### Scenario: A scenario acts on a control that addresses users by identifier

- **WHEN** a scenario asks for one of the run's provisioned users
- **THEN** it receives the identifier the application assigned that user
- **AND** it does not have to read that identifier off a screen that never displays it
