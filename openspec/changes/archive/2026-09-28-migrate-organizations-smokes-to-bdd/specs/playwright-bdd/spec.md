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

#### Scenario: A shared feature is only partly ported

- **WHEN** this service copies only some of a Cucumber feature's scenarios
- **THEN** the scenarios it does carry are identical to their Cucumber counterparts
- **AND** the ones it does not carry are absent rather than present with a different definition

#### Scenario: A shared feature is completed incrementally

- **WHEN** a scenario is added to a feature this service already partly carries
- **THEN** the scenarios already present are unchanged
- **AND** the newly added ones are identical to their Cucumber counterparts
