# cucumber-seeded-users Specification

## Purpose

Defines what a Cucumber run guarantees about the extra Gitea accounts it creates for itself, beyond the fixed "owner" account, so scenarios can log in as more than one real user.

## Requirements

### Requirement: A run provisions its own extra users for the whole run

A Cucumber run SHALL create its own Gitea user accounts, beyond the fixed owner account, once before any scenario runs, and SHALL make each one's credentials available to any scenario in that run.

#### Scenario: A run starts

- **WHEN** a Cucumber run begins
- **THEN** its own Gitea user accounts exist before the first scenario's steps run

#### Scenario: A scenario needs one of the run's own users

- **WHEN** a scenario asks for one of the run's provisioned users
- **THEN** it receives that user's username and password

### Requirement: Each browser's provisioned users are unique to that browser

A provisioned user's name SHALL be unique to the browser process that created it, so that a multi-browser parallel run creates one full set of users per browser rather than sharing or colliding over one set.

#### Scenario: Three browsers run in parallel

- **WHEN** chrome, firefox and edge each run their own Cucumber process against the same Gitea instance
- **THEN** each process's provisioned users are named distinctly from the other two processes' users

### Requirement: Provisioned users are torn down when the run ends

Every user a run provisions for itself SHALL be deleted once the run ends, regardless of whether its scenarios passed or failed.

#### Scenario: The run ends

- **WHEN** a Cucumber run's last scenario finishes, whether it passed or failed
- **THEN** every user that run provisioned for itself is deleted
