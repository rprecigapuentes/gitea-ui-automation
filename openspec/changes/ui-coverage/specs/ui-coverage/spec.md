## ADDED Requirements

### Requirement: The framework measures how much of the crawled UI its BDD suite exercises

The framework SHALL report, per level, how much of the application's UI the `playwright-bdd` suite
exercises: URLs, then interactive elements per URL, then states per element. The denominator of each
level SHALL be the inventory produced by crawling the running application, never the specs under
`openspec/specs/`. The numerator SHALL be derived from the page objects that the suite's steps
reach, by static parsing and without a model.

The inventory SHALL be committed as data, ordered and free of generated ids and timestamps, so that
two runs can be compared with a diff. The measurement SHALL NOT require any change to a page object
or to a step.

#### Scenario: A page object locator is reached by a step

- **WHEN** a step of the BDD suite reaches a locator of a page object
- **THEN** the crawled elements that locator selects count as covered at the element level

#### Scenario: A page object is never reached by a step

- **WHEN** no step of the BDD suite reaches a page object
- **THEN** none of its locators count towards any level

#### Scenario: Two runs crawl the same application

- **WHEN** the crawler runs twice against the same application state
- **THEN** the two inventories are identical

#### Scenario: A state cannot be inferred

- **WHEN** the method that reads a locator does not imply a state
- **THEN** that state is not counted as covered
