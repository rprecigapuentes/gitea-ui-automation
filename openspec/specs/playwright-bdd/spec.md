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

### Requirement: The login scenario is shared with the Cucumber service

The service SHALL carry the same login feature text as the Selenium Cucumber service, and SHALL resolve each of its steps to a step definition of its own.

#### Scenario: The two services describe login

- **WHEN** the login feature of both services is compared
- **THEN** their Gherkin text is identical

#### Scenario: A step of the login scenario is matched

- **WHEN** the runner reaches a step of the login scenario
- **THEN** exactly one step definition of this service matches it

### Requirement: Steps reach the browser only through page objects

A step definition SHALL drive the application only through the shared page objects, built over the Playwright interaction strategy, and SHALL NOT call the page or locators directly.

#### Scenario: The login steps run

- **WHEN** the login scenario opens the login page, logs in and asserts the dashboard
- **THEN** every browser interaction goes through the login page and main page objects

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
