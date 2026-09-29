# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: The login scenario is shared with the Cucumber service`
- TO: `### Requirement: A feature shared with the Cucumber service carries identical text`

## MODIFIED Requirements

### Requirement: A feature shared with the Cucumber service carries identical text

Where a feature of this service describes the same behaviour as a feature of the Selenium Cucumber
service, the two SHALL carry identical Gherkin text, and this service SHALL resolve every step of
that feature to exactly one step definition of its own. Neither service SHALL edit shared feature
text to suit its own runner, because the edit reaches the other suite.

#### Scenario: The two services describe login

- **WHEN** the login feature of both services is compared
- **THEN** their Gherkin text is identical

#### Scenario: A step of the login scenario is matched

- **WHEN** the runner reaches a step of the login scenario
- **THEN** exactly one step definition of this service matches it

#### Scenario: More than one feature is shared

- **WHEN** this service carries several features that the Cucumber service also carries
- **THEN** each of them is identical to its counterpart, character for character
- **AND** no feature is exempt because it was added after login

#### Scenario: A step's wording does not suit this runner

- **WHEN** this service would express a step of a shared feature differently
- **THEN** the feature text is left as the two services share it
- **AND** the difference is absorbed by the step definition
