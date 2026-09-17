# Spec Delta

## MODIFIED Requirements

### Requirement: A suite reaches the browser through the Selenium server its own job starts

A suite whose framework drives a remote browser SHALL address the Selenium server started alongside it in the same job. The job SHALL fail before any test executes when that server does not report itself ready, and the failure SHALL name the component that did not answer. A suite whose framework launches its own browsers is not covered by this requirement.

#### Scenario: A remote-browser suite starts a session

- **WHEN** a suite whose framework drives a remote browser requests a session
- **THEN** the request is made to the Selenium server running in the same job

#### Scenario: The remote browser never becomes ready

- **WHEN** the Selenium server does not report itself ready within the job's wait
- **THEN** the job fails before any test executes
- **AND** the failure names the server that did not answer

#### Scenario: A locator no longer matches any element

- **WHEN** a locator fails to match any element
- **THEN** the test fails on that locator
- **AND** no substitute element is resolved on its behalf

## ADDED Requirements

### Requirement: A suite that launches its own browsers runs where those browsers are present

A suite whose framework launches browsers inside the job SHALL run in an environment that already provides them, and every browser its matrix names SHALL be available before any test executes. Where the matrix names a branded browser, the suite SHALL drive that product rather than a substitute engine, so that a result can be attributed to the browser it claims. The job SHALL fail before any test executes when a named browser cannot be provided.

#### Scenario: The suite starts

- **WHEN** the job runs a suite whose framework launches its own browsers
- **THEN** every browser that suite's matrix names is already present in the job
- **AND** no test has executed before that is true

#### Scenario: The matrix names branded browsers

- **WHEN** the suite runs the project it names after a branded browser
- **THEN** that project drives the named product rather than the engine the product is built on
- **AND** two projects naming different products do not resolve to the same binary

#### Scenario: A named browser cannot be provided

- **WHEN** a browser the matrix names cannot be installed or launched in the job
- **THEN** the job fails before any test executes
- **AND** the failure names the browser that is missing
