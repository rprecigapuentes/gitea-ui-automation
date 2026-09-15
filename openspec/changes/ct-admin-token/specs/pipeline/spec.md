## ADDED Requirements

### Requirement: A job provisions every account and token its suite needs

Each job SHALL create, on its own ephemeral application under test, every Gitea account and API token the suite it runs expects to find already present, and SHALL publish them to the suite. A suite MUST NOT depend on an account or token carried in from outside the run, because the instance it runs against is created fresh for that job and holds nothing from any earlier run.

#### Scenario: A suite expects an account the instance does not have

- **WHEN** a job starts against a freshly created application under test
- **THEN** every account the suite it runs reads from its environment is registered before the suite starts
- **AND** an API token is issued for each account the suite reads a token for
- **AND** each is published to the suite under the name that suite reads

#### Scenario: A suite requires an administrative account

- **WHEN** the suite a job runs performs operations that only an administrator may perform
- **THEN** the job provisions an administrative identity distinct from the accounts its scenarios drive through the browser
- **AND** issues that identity a token carrying administrative privilege
- **AND** the tokens issued to the accounts the scenarios drive do not carry administrative privilege

#### Scenario: A token is issued to an account that turns out not to be privileged

- **WHEN** a job issues a token that claims administrative privilege
- **AND** that token is refused by an operation only an administrator may perform
- **THEN** the job fails at the provisioning step, before the suite starts
- **AND** the failure names the account and the privilege it lacks

#### Scenario: A token reaches the run log

- **WHEN** a job issues any API token
- **THEN** the token's value is masked in the run's output
