# Spec Delta

## ADDED Requirements

### Requirement: A failing run proposes the locator to change, having verified it

When a run has attributed a failure to a locator, it SHALL identify the page object and the declared
key that owns the failing selector, obtain a candidate from the page as it stands, apply that
candidate and re-run the scenario that failed. The run SHALL publish a proposal only when the re-run
passes, the change is confined to the locators a page object declares, and the suite still passes on
the browser that failed. The proposal SHALL name the file, the key, the selector it replaces, the
one it proposes and what was re-run to establish it. The run SHALL NOT apply, commit or merge a
proposal, and its outcome SHALL remain the failure the suite reported.

#### Scenario: A locator failure is verified and proposed

- **WHEN** a failure is attributed to a locator and a candidate is found that makes the failing
  scenario pass, changing nothing but a page object's declared locators, with the suite still
  passing on that browser
- **THEN** the run publishes the file, the key, both selectors and what was re-run
- **AND** the change is not committed anywhere
- **AND** the run still reports the failure the suite reported

#### Scenario: The candidate does not make the scenario pass

- **WHEN** no candidate makes the failing scenario pass within the attempts the run allows
- **THEN** no proposal is published
- **AND** the working tree is left as the run found it
- **AND** the run still publishes the explanation of the failure

#### Scenario: The repair would break another scenario

- **WHEN** a candidate makes the failing scenario pass but the suite no longer passes on that browser
- **THEN** no proposal is published
- **AND** the working tree is left as the run found it

#### Scenario: The agent changed something other than a locator

- **WHEN** the change made on the way to a passing scenario touches anything outside the locators a
  page object declares
- **THEN** no proposal is published, whether the scenario passes or not
- **AND** the working tree is left as the run found it

#### Scenario: The failure was not attributed to a locator

- **WHEN** a run's failures are attributed to causes other than a locator
- **THEN** no page is opened and no repair is attempted
- **AND** the run publishes its explanations as it already does

#### Scenario: The agent is given browser tools

- **WHEN** the run hands an agent the browser to collect candidates from
- **THEN** the tools it may call are enumerated rather than left to whatever the server exposes
- **AND** no tool that executes code outside the application under test is among them
- **AND** what the agent may leave behind is bounded by the change being confined and uncommitted,
  not by the enumeration
