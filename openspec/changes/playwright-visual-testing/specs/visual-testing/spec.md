# Spec Delta

## ADDED Requirements

### Requirement: A screenshot check lives outside the page objects

A screenshot comparison SHALL be made by a dedicated visual tester that is handed the page, or a locator, and the name of the baseline. A page object SHALL NOT expose or perform a screenshot comparison, and the interaction strategy contract SHALL NOT carry one, because the check has no equivalent on every strategy.

#### Scenario: A test checks a page

- **WHEN** a test verifies that a page matches its baseline
- **THEN** it hands the page and a baseline name to the visual tester
- **AND** no page object method performs the comparison

#### Scenario: A test checks a component

- **WHEN** a test verifies one element against its baseline
- **THEN** it hands the visual tester that element's locator and a baseline name

### Requirement: The visual tester is a fixture of the visual suite only

The visual tester SHALL reach a test as a fixture that extends the suite fixture, so a test declares it in its parameters instead of constructing it. A functional test SHALL NOT load it.

#### Scenario: A visual test needs the tester

- **WHEN** a visual spec declares the visual tester
- **THEN** it receives one without constructing it

#### Scenario: A functional test runs

- **WHEN** a functional test runs
- **THEN** the visual fixture is not loaded

### Requirement: A page declares the regions of its view that vary between runs

A page object SHALL expose the selectors of the regions of its view whose content varies between runs, as plain selector strings, and SHALL expose an empty list until a region is identified. A spec SHALL take the regions to leave out of a comparison from the page object and SHALL NOT build locators for them itself.

#### Scenario: A view has no known volatile region

- **WHEN** a page object has no identified volatile region
- **THEN** it exposes an empty list

#### Scenario: A volatile region is identified

- **WHEN** a region of a view is found to vary between runs
- **THEN** its selector is added to that page object's list
- **AND** no spec changes

### Requirement: A visual spec prepares its state through the API inside the test

A visual spec SHALL create the state a view needs through the API clients, in the body of the test and before it opens the view, and SHALL NOT drive the interface to reach a state the API can create. The data it creates SHALL be named per project, so browsers running in parallel never share one. What the spec creates SHALL be removed by a hook, not by the body of the test, so that the removal runs when a step fails and the test body holds no clean-up.

#### Scenario: A view needs an organization

- **WHEN** a visual spec needs an organization to exist before a view
- **THEN** the spec creates it through the API client, in the test body
- **AND** opens the view through its page object

#### Scenario: A step fails partway

- **WHEN** a step of a visual spec fails after it created data
- **THEN** the data is still removed by the hook

### Requirement: Visual specs are grouped by the area they cover and name their baselines by view

A visual spec SHALL live in a folder named for the area of the application it covers, and the name of each baseline SHALL identify its view and be unique across the whole suite, because baselines of every spec share one folder per project and platform. A spec that leaves an organization behind SHALL record it so the clean-up hook removes it together with the repositories it holds.

#### Scenario: A spec is added for an area

- **WHEN** a visual spec is added
- **THEN** it lives in the folder of the area it covers
- **AND** its baseline names do not collide with those of any other spec

#### Scenario: A spec creates repositories in its organization

- **WHEN** a spec creates repositories inside an organization it recorded
- **THEN** the clean-up hook removes those repositories and then the organization

### Requirement: A view can be checked as two accounts against one baseline

A visual spec MAY sign in through the interface as one account, check a view, sign out, sign in as a second account and check the same view against the same baseline, so that a view meant to look the same for every user is proven to. The two accounts SHALL be the owner and the invited account of the project's browser. A region that legitimately differs between the accounts SHALL be excluded by masking it, not by using two baselines.

#### Scenario: Two accounts see the same view

- **WHEN** a spec checks a view as the owner and then as the invited account
- **THEN** both checks compare against the same baseline

#### Scenario: A region differs between the accounts

- **WHEN** the two checks differ only in a region that belongs to the account
- **THEN** the region is masked and the checks pass

### Requirement: A project resolves the owner and the invited account of its browser

A visual project SHALL resolve the invited account as it resolves the owner account, from the environment variables of its browser, and a missing variable SHALL fail with an error that names it. A project named for the bundled Chromium SHALL resolve both from the Chrome accounts.

#### Scenario: The invited account is missing

- **WHEN** the environment lacks the invited account of a project's browser
- **THEN** resolving it fails
- **AND** the error names the missing variable

### Requirement: A visual mismatch does not stop the test

A screenshot check SHALL be a soft assertion. A mismatch SHALL be recorded and the test SHALL continue with the steps after it, and SHALL fail when it ends. The failure SHALL keep the expected, actual and diff images.

#### Scenario: A page differs from its baseline

- **WHEN** a screenshot check finds the page differs from its baseline
- **THEN** the steps after the check still run
- **AND** the test is reported as failed

#### Scenario: A page matches its baseline

- **WHEN** a screenshot check finds the page matches its baseline
- **THEN** the check records no failure

### Requirement: The visual suite has its own projects and baselines

The visual specs SHALL run in projects of their own on `tests/non-functional/visual/`, and the functional projects SHALL NOT run them. Baselines SHALL be stored per project name and per platform, so two browsers never share a baseline and a baseline recorded on one platform is never compared on another, and a project SHALL NOT retry a failed comparison.

#### Scenario: The functional suite runs

- **WHEN** the functional projects run
- **THEN** no visual spec runs

#### Scenario: A baseline is recorded

- **WHEN** a baseline is recorded by a visual project
- **THEN** it is stored under that project's name and the platform it was recorded on
- **AND** no other project or platform reads it

### Requirement: The visual suite runs on every functional browser, in parallel

The visual suite SHALL have one project per browser the functional suite runs on, derived from the same browser list so the two never diverge. A run of the whole suite SHALL give each project its own worker and run the specs of one project one after another, so that a browser's account is never used by two specs at once, while the projects run in parallel with one another. Each project SHALL sign in with the account of its own browser.

#### Scenario: The visual suite is run

- **WHEN** the visual suite is run
- **THEN** every browser the functional suite runs on has a visual project
- **AND** the projects execute in parallel with one another
- **AND** the specs of one project execute one after another

#### Scenario: The functional browser list changes

- **WHEN** a browser is added to or removed from the functional browser list
- **THEN** the visual projects follow it without a second edit

### Requirement: The visual suite has its own entry points that open one report

The visual suite SHALL have an entry point that runs only the visual projects and SHALL open one native Playwright report covering every browser when the run ends, even though each browser ran in a process of its own, whether it passed or failed. A separate entry point SHALL record the baselines of every browser, and one entry point per browser SHALL run that browser alone. The default test entry point SHALL NOT run any of them.

#### Scenario: The visual suite is run

- **WHEN** the visual entry point is run
- **THEN** only the visual projects run
- **AND** one native report opens when it ends, pass or fail

#### Scenario: One browser is run

- **WHEN** the entry point of one browser is run
- **THEN** only that browser's visual project runs

#### Scenario: The default test entry point is run

- **WHEN** the default test entry point is run
- **THEN** no visual spec runs

### Requirement: The bundled Chromium uses the Chrome account

A project named for the bundled Chromium SHALL resolve its owner credentials from the Chrome account, since the engine is the same and no account exists for Chromium itself. Every other browser SHALL resolve its own account.

#### Scenario: A Chromium project needs the owner credentials

- **WHEN** a project named for the bundled Chromium resolves the owner credentials
- **THEN** it receives the Chrome account's

#### Scenario: A Firefox project needs the owner credentials

- **WHEN** a Firefox project resolves the owner credentials
- **THEN** it receives the Firefox account's
