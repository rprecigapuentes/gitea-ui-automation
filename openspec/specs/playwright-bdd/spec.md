# playwright-bdd Specification

## Purpose

Defines how the Playwright BDD service turns Gherkin features into Playwright tests and runs them, so the same scenarios can be compared across runners.

## Requirements

### Requirement: Features are converted into Playwright tests and run by the Playwright runner

The service SHALL generate Playwright tests from the `.feature` files under its own `features` directory and SHALL run them with the Playwright test runner.

#### Scenario: A feature is run

- **WHEN** the service's test command runs
- **THEN** a Playwright test exists for each scenario of its features, and the runner reports each one

#### Scenario: A feature is edited

- **WHEN** a scenario's steps change and the test command runs again
- **THEN** the generated tests reflect the edited feature, with no manual regeneration step

### Requirement: A feature shared with the Cucumber service carries identical text

Where a feature of this service describes the same behaviour as a feature of the Selenium Cucumber service, the two SHALL carry identical Gherkin text, and this service SHALL resolve every step of that feature to exactly one step definition of its own. Neither service SHALL edit shared feature text to suit its own runner, because the edit reaches the other suite.

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

#### Scenario: A step's wording does not suit this runner

- **WHEN** this service would express a step of a shared feature differently
- **THEN** the feature text is left as the two services share it
- **AND** the difference is absorbed by the step definition

### Requirement: Steps reach the browser only through page objects

A step definition SHALL drive the application only through the shared page objects, built over the Playwright interaction strategy, and SHALL NOT call the page or locators directly.

#### Scenario: The login steps run

- **WHEN** the login scenario opens the login page, logs in and asserts the dashboard
- **THEN** every browser interaction goes through the login page and main page objects

### Requirement: An organization a scenario creates is removed afterwards

The service SHALL remove an organization a scenario created through the browser, together with the repositories it owns, once the scenario ends, whether it passed or failed. Before a scenario tagged `@organization` runs, the service SHALL remove the organizations a crashed run left under that scenario's own name prefix, and SHALL leave every other organization alone.

#### Scenario: A scenario that creates an organization passes

- **WHEN** a scenario creates an organization and ends with every step passing
- **THEN** the organization and its repositories no longer exist on the instance

#### Scenario: A scenario that creates an organization fails

- **WHEN** a scenario creates an organization and a later step fails
- **THEN** the organization and its repositories no longer exist on the instance

#### Scenario: A crashed run left an organization behind

- **WHEN** a scenario tagged `@organization` starts and an organization under its name prefix survives from an earlier run
- **THEN** that organization is removed before the scenario's first step

#### Scenario: Another suite's organization exists

- **WHEN** a scenario tagged `@organization` starts and an organization outside its name prefix exists
- **THEN** that organization is not removed

#### Scenario: A scenario never touches an organization

- **WHEN** a scenario that creates no organization runs
- **THEN** the teardown finds nothing recorded and removes nothing

### Requirement: Each browser runs with its own account, in parallel

The service SHALL define one Playwright project per browser (chrome, firefox and edge), SHALL resolve the owner credentials from the running project's browser, and SHALL support running the three at once and running each alone.

#### Scenario: One browser is run alone

- **WHEN** the run is limited to the firefox project
- **THEN** the login scenario logs in with the firefox owner account

#### Scenario: The three browsers are run together

- **WHEN** the run covers chrome, firefox and edge
- **THEN** the scenarios run in parallel workers and each project logs in with its own browser's account

#### Scenario: Credentials are missing

- **WHEN** the owner account of a browser is not configured
- **THEN** the run fails with an error naming the missing variable for that browser

### Requirement: Results are reported in the format the other functional suites share

The service SHALL write one JUnit file per browser when a single browser is run, so parallel runs do not overwrite each other.

#### Scenario: A single browser is run

- **WHEN** the run is limited to one browser
- **THEN** its JUnit file name carries that browser

### Requirement: Results are reported through Allure

The service SHALL write Allure results for every run and SHALL be able to generate a single-file Allure report from them.

#### Scenario: A run finishes

- **WHEN** the service's tests run
- **THEN** Allure results exist for each scenario, naming the browser it ran on

#### Scenario: The report is generated

- **WHEN** the report command runs after a run
- **THEN** a single-file Allure report is produced from that run's results

### Requirement: A local run ends by showing the Allure report

Each test command SHALL, when run outside CI, discard the previous Allure results before the run, generate the report and open it once the run ends, whether the tests passed or failed, and SHALL exit with the tests' own exit code.

#### Scenario: A local run passes

- **WHEN** a test command finishes with every scenario passing outside CI
- **THEN** the Allure report of that run is generated and opened

#### Scenario: A local run fails

- **WHEN** a test command finishes with a failing scenario outside CI
- **THEN** the report is still generated and opened, and the command exits with a failing code

#### Scenario: Three browsers run in parallel

- **WHEN** the parallel command runs the three browsers as separate processes
- **THEN** one report covering all three is generated after the last of them ends

#### Scenario: A run on CI

- **WHEN** a test command runs on CI
- **THEN** it runs the tests and exits with their code, without generating or opening a report
