## ADDED Requirements

### Requirement: A run publishes what the healing proxy did in each of its sessions

For every browser session a suite opens through the healing proxy, the workflow SHALL publish the proxy's log for that session and the store's report for it, as part of the same artifact that carries the suite's report. It SHALL do so whether the suite passed or failed, and SHALL summarize the heals in the run's log so that a reader does not need the artifact to know whether anything was healed. The summary SHALL be derived from the proxy's log, which records every heal, rather than from the store's report, which the proxy leaves empty when it saves a heal without a session key.

#### Scenario: A session healed a locator

- **WHEN** a suite's session resolved at least one locator through a stored baseline
- **THEN** the run's log names, for that session, the locator that failed, the locator it was healed to, and the score of the substitution, read from the proxy's log
- **AND** the artifact holds the proxy's log lines for that session and the store's report for it

#### Scenario: A session healed nothing

- **WHEN** a suite's session resolved every locator directly
- **THEN** the run's log states that the session recorded no heal
- **AND** the artifact still holds the proxy's log lines for that session

#### Scenario: The suite failed before the evidence was collected

- **WHEN** the suite's step fails
- **THEN** the evidence for every session it opened is still collected and published

#### Scenario: The evidence cannot be collected

- **WHEN** the proxy or the store does not answer the request for a session's evidence
- **THEN** the run reports which session's evidence is missing
- **AND** the suite's own outcome decides the job, not the missing evidence
