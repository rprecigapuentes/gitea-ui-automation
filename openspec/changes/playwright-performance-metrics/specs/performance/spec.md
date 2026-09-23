# Spec Delta

## Purpose

Covers how the framework measures the cost of arriving at a page it already automates: what a measurement collects, how it is taken so that two runs can be compared, what decides its outcome, and what evidence it leaves for a person to read.

## ADDED Requirements

### Requirement: A measurement describes the navigation under test, not the one that preceded it

A measurement SHALL describe the load of the page the test navigated to through its page object. Where a session has to be established first, the measurement SHALL be read after the navigation under test, so that no figure published for a page describes the navigation that established the session.

#### Scenario: The page requires a session

- **WHEN** a measurement targets a page only a signed-in user can reach
- **THEN** the session is established through the mechanism the functional tests use
- **AND** the page under test is navigated to afterwards
- **AND** the figures published are those of that navigation

#### Scenario: The page is reachable anonymously

- **WHEN** a measurement targets a page an anonymous visitor can reach
- **THEN** no session is established beforehand

#### Scenario: The page is still settling

- **WHEN** the page object reports the page ready
- **THEN** the measurement is read at that point and not before

### Requirement: A page is measured more than once and published as a distribution

A page SHALL be loaded more than once in a single run, and the result SHALL be published as a central value together with the spread of the loads behind it. A single load SHALL NOT decide an outcome, so that the variance of the machine is visible in the evidence rather than hidden in one figure.

#### Scenario: A page is measured

- **WHEN** a page is measured in a run
- **THEN** it is loaded more than once
- **AND** the published result carries a central value and the spread of those loads

#### Scenario: One load is an outlier

- **WHEN** a single load departs sharply from the others
- **THEN** it does not by itself decide the outcome
- **AND** it remains visible in the published spread

### Requirement: A cold load and a warm reload are published as separate figures

A run SHALL distinguish the first load of a page in a fresh context from a reload of the same page in that context, and SHALL publish them as two figures. The two SHALL NOT be combined into one, because they answer different questions and are not comparable to one another.

#### Scenario: Both are measured

- **WHEN** a page is measured cold and again warm
- **THEN** each is published as its own figure
- **AND** neither is averaged into the other

#### Scenario: A figure is read

- **WHEN** a published figure is read
- **THEN** it states which of the two it is

### Requirement: A measurement records where the time and the weight went

A measurement SHALL record the phases of the navigation, the point at which the page first rendered content, and the count and transferred weight of the resources the page requested. Where the browser exposes counters of its own work, the measurement SHALL record those too, so that a slow page can be explained and not only reported.

#### Scenario: A page is slow

- **WHEN** a published measurement shows a page taking longer than its baseline allows
- **THEN** the phases of the navigation are available in the same evidence
- **AND** the resources the page requested are available with their count and weight

#### Scenario: The browser exposes no counters of its own

- **WHEN** the browser under measurement exposes no engine counters
- **THEN** the remaining figures are published without them
- **AND** the absence is not reported as a failure

### Requirement: A run leaves the network exchange behind in an inspectable form

A run SHALL record the exchange between the browser and the application under test as a file a person can open, carrying each request's outcome and the headers that govern caching and compression, which the timing figures cannot report. Response bodies SHALL NOT be retained, so the evidence stays small enough to publish on every run.

#### Scenario: A resource fails or redirects

- **WHEN** a request the page made did not return the resource directly
- **THEN** its outcome is readable in the recording

#### Scenario: The evidence is published

- **WHEN** the recording is published
- **THEN** it carries the headers governing caching and compression
- **AND** it carries no response bodies

### Requirement: An outcome is decided against a recorded tolerance, not an exact figure

A measurement SHALL be judged against a recorded baseline that states a tolerance for each metric rather than an exact value, because no two runs of a measurement produce the same number. A measurement inside its recorded tolerance SHALL pass. One outside it SHALL fail, and the failure SHALL name the metric, the tolerance recorded and the value observed.

#### Scenario: A measurement falls inside its tolerance

- **WHEN** every metric of a page falls inside the tolerance its baseline records
- **THEN** the measurement passes

#### Scenario: A measurement falls outside its tolerance

- **WHEN** a metric falls outside the tolerance its baseline records
- **THEN** the measurement fails
- **AND** the failure names the metric, the recorded tolerance and the observed value

#### Scenario: No baseline exists yet for a page

- **WHEN** a page is measured before any baseline is recorded for it
- **THEN** the run records one rather than passing silently

### Requirement: A run publishes its figures whether it passed or failed

Every measurement SHALL publish its full set of figures, on pass and on fail, as a file named for the page and the browser it ran on, so that a run can be read without rerunning it and two runs can be compared after the fact.

#### Scenario: A measurement passes

- **WHEN** every metric falls inside its tolerance
- **THEN** the full figures are still published

#### Scenario: A measurement fails

- **WHEN** a metric falls outside its tolerance
- **THEN** the full figures are still published

#### Scenario: Two runs are compared

- **WHEN** the published files of two runs are read together
- **THEN** each figure can be matched to the page and browser it came from
