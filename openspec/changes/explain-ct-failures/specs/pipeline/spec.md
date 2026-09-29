## ADDED Requirements

### Requirement: A failing functional run publishes a written explanation of what failed

When a functional suite fails, the workflow SHALL publish, alongside that suite's report, a
machine-readable explanation of every test that did not pass. Each entry SHALL name the test, the
step of the scenario that failed, a category, how confident the explanation is, the reasoning behind
it and the first thing a reader should check. The category SHALL be `unknown` whenever the published
material does not support a cause, so that a reader can tell a diagnosis from a guess.

The step named SHALL be one the scenario itself declares, never an internal wait or click the
framework issued on its behalf, because the reader is looking for the behaviour that broke and not
for the mechanics under it.

Producing the explanation SHALL NOT change the run's outcome: a run that failed reports failure, and
one that could not be explained reports the same failure it would have reported anyway.

Any credential the explanation needs SHALL be given to the step that uses it and never to the job,
because the job also checks out and runs the repository's own code.

#### Scenario: A functional suite fails

- **WHEN** a functional suite ends with at least one test that did not pass
- **THEN** an explanation naming each of those tests is published with that suite's report
- **AND** each entry carries the failing step, a category, a confidence, the reasoning and the first
  thing to check

#### Scenario: The published material does not support a cause

- **WHEN** what the run published is not enough to say why a test failed
- **THEN** that test's category is `unknown`
- **AND** no cause is named

#### Scenario: A test retried an internal wait and passed

- **WHEN** a test that passed contains an internal step that failed before succeeding
- **THEN** that test is not explained
- **AND** no step of it is reported as having failed

#### Scenario: The explanation cannot be produced

- **WHEN** the explanation step cannot run or cannot reach the model
- **THEN** the run reports the outcome its tests produced
- **AND** the step's own failure does not become the run's

#### Scenario: Every test passes

- **WHEN** a functional run ends with no failure
- **THEN** no explanation is produced

#### Scenario: A step needs a credential of its own

- **WHEN** a workflow step calls a service outside the run
- **THEN** that step receives the credential
- **AND** the job it belongs to does not
