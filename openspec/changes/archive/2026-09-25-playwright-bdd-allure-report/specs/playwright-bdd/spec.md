## ADDED Requirements

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
