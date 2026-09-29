## ADDED Requirements

### Requirement: The quality gate fails a spec that reaches the browser without a page object

A test or step definition SHALL reach the browser only through a page object, and the quality checks SHALL enforce that mechanically rather than leave it to review. A file under a suite's spec or step-definition directory that calls the browser driver or the page directly SHALL fail those checks, naming the file, the line and the route through the page object that replaces the call. The enforcement SHALL run both before a commit is written and in the pipeline job that gates a change, so generated code cannot reach a branch without passing it. Code that owns the browser - page objects, the interaction strategies and the fixtures that build them - SHALL NOT be subject to it.

#### Scenario: A spec calls the browser directly

- **WHEN** a file under a suite's spec or step-definition directory calls the browser driver or the page directly
- **THEN** the quality checks fail
- **AND** the failure names the file, the line and the page-object route that replaces the call

#### Scenario: A generated step definition drifts

- **WHEN** a generated file reaching the browser directly is staged for commit
- **THEN** the commit is refused before it is written

#### Scenario: A change is pushed

- **WHEN** the pipeline's quality job runs on a branch carrying such a file
- **THEN** that job fails

#### Scenario: A page object calls the browser

- **WHEN** a page object, an interaction strategy or a fixture calls the browser
- **THEN** the checks pass, because that is the code the rule routes callers to
