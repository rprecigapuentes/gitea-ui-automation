# Spec Delta

## ADDED Requirements

### Requirement: A scan runs against the rendered page the suite already reached

An accessibility scan SHALL analyse the page in the state the test navigated it to, using the session the suite already holds. A scan of a page that requires authentication SHALL reach it through the same session mechanism the functional tests use, and SHALL NOT drive the login form to get there.

#### Scenario: A scan needs a signed-in page

- **WHEN** a scan targets a page only a signed-in user can reach
- **THEN** the session is established through the mechanism the functional tests use
- **AND** the scan analyses the page as rendered for that user

#### Scenario: A scan needs an anonymous page

- **WHEN** a scan targets a page an anonymous visitor can reach
- **THEN** no session is established before the scan

### Requirement: Every scan evaluates the same declared rule set

The rule tags a scan evaluates SHALL be declared in one place shared by every scan, so that two scans are never compared against different rules. Changing the declared set SHALL change every scan at once.

#### Scenario: Two pages are scanned in one run

- **WHEN** more than one page is scanned in a single run
- **THEN** each is evaluated against the same declared rule tags

#### Scenario: The declared set changes

- **WHEN** the declared rule tags change
- **THEN** every scan evaluates the new set
- **AND** no scan carries a rule set of its own

### Requirement: A scan fails on a violation that was not there before

A scan SHALL be judged against a recorded baseline of the violations already known for that page and browser, not against an empty result. A violation absent from the baseline SHALL fail the scan, and the failure SHALL name the rule and the element it fired on. A violation the baseline records SHALL NOT fail the scan.

#### Scenario: A new violation appears

- **WHEN** a scan returns a violation the baseline does not record
- **THEN** the scan fails
- **AND** the failure names the rule and the element

#### Scenario: Only known violations are returned

- **WHEN** a scan returns only violations the baseline records
- **THEN** the scan passes

#### Scenario: No baseline exists yet for a page

- **WHEN** a page is scanned before any baseline is recorded for it
- **THEN** the run records one rather than passing silently

### Requirement: A scan leaves its violations behind in a form a person can read

Every scan SHALL publish its full result, whether it passed or failed, both attached to the test result and as a file named for the page and the browser it ran on. The published result SHALL carry every violation rule, its impact and its offending elements, so that severity triage needs nothing but the artifact.

#### Scenario: A scan passes

- **WHEN** a scan returns violations that its baseline already records
- **THEN** the full result is still published

#### Scenario: A scan runs on three browsers

- **WHEN** the same page is scanned on more than one browser
- **THEN** each browser publishes its own file
- **AND** no two files share a name

#### Scenario: A person triages the findings

- **WHEN** a published result is read
- **THEN** every violation carries its rule, its impact and the elements it fired on

### Requirement: A published violation names the standard it failed

Every violation the report presents SHALL carry the WCAG success criteria its rule maps to and the conformance level those criteria sit at, so that a finding is read against the standard rather than against the vocabulary of the tool.

#### Scenario: A rule maps to a success criterion

- **WHEN** a violated rule declares WCAG success criteria
- **THEN** the report names those criteria and their conformance level beside the rule

#### Scenario: A rule maps to no success criterion

- **WHEN** a violated rule declares no WCAG success criterion
- **THEN** the report presents the rule without inventing one

#### Scenario: A reader counts the criteria at stake

- **WHEN** the report is read
- **THEN** it states how many distinct success criteria the run failed
