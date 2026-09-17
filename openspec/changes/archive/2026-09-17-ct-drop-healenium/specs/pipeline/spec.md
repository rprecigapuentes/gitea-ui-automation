# Spec Delta

## ADDED Requirements

### Requirement: A suite reaches the browser through the Selenium server its own job starts

A suite SHALL address the Selenium server started alongside it in the same job. The job SHALL fail before any test executes when that server does not report itself ready, and the failure SHALL name the component that did not answer.

#### Scenario: A suite starts a session

- **WHEN** a suite requests a browser session
- **THEN** the request is made to the Selenium server running in the same job

#### Scenario: The browser never becomes ready

- **WHEN** the Selenium server does not report itself ready within the job's wait
- **THEN** the job fails before any test executes
- **AND** the failure names the server that did not answer

#### Scenario: A locator no longer matches any element

- **WHEN** a locator fails to match any element
- **THEN** the test fails on that locator
- **AND** no substitute element is resolved on its behalf

## REMOVED Requirements

### Requirement: Suites reach the browser through the healing proxy

**Reason**: Healenium is no longer available: permission to use it was withdrawn and its containers have been taken down. A workflow that insists on reaching the browser through the proxy cannot start at all.

**Migration**: Suites address the Selenium server directly, as covered by "A suite reaches the browser through the Selenium server its own job starts" above. A locator whose target has drifted is fixed in the page object that owns it.

### Requirement: The healing store outlives the run

**Reason**: There is no healing store left for a run to outlive, so a requirement forbidding a per-run store describes a component the workflow no longer has.

**Migration**: None. Nothing records or reads a baseline. Every service the workflow depends on is now created per job and torn down with it.

### Requirement: A run publishes what the healing proxy did in each of its sessions

**Reason**: With no proxy and no store there is no heal to publish, and the step that queried them fails on every run.

**Migration**: A run's artifact carries the suite's own report, which "Each suite publishes its own report" already requires.
