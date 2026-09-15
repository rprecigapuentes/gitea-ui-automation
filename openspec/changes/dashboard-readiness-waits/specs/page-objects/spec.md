## ADDED Requirements

### Requirement: A check that reports false says why

A check that reports its outcome as a boolean SHALL record, in the run log, what made it report false: the values it compared, or the error it caught and the page the browser was on. A bare false collapses every cause into one indistinguishable outcome, so a failing run cannot be diagnosed from its own output and the next change is a guess.

#### Scenario: A compared value is not what the check expects

- **WHEN** a check reports false because a value it read differs from what it expects
- **THEN** the run log records each compared value and what it resolved to

#### Scenario: A read raises inside a check that reports

- **WHEN** a read inside a check raises and the check reports false rather than propagating it
- **THEN** the run log records the error and the page the browser was on
- **AND** the report is distinguishable from a check whose values simply did not match

### Requirement: Waits are explicit, and only explicit

The framework SHALL wait for elements through explicit, condition-based waits, and SHALL NOT also set a global implicit wait on the driver. The two do not compose: a lookup that legitimately matches nothing blocks for the whole implicit duration before reporting it, so every absence check and every failed poll inside an explicit wait pays it again, and no configured budget corresponds to the time actually spent.

#### Scenario: A lookup matches nothing

- **WHEN** a lookup runs against a screen the element is not on
- **THEN** it reports the absence without waiting for any implicit budget
- **AND** the time it takes is bounded by the explicit wait its caller asked for

#### Scenario: An explicit wait polls a condition that is not yet true

- **WHEN** an explicit wait polls a condition whose lookups match nothing on the early attempts
- **THEN** each attempt costs only what the lookup itself costs
- **AND** the wait performs the number of attempts its budget allows

### Requirement: An action whose outcome is a navigation waits for that navigation

A page object action that submits a form or follows a link SHALL NOT return until the browser has reached the page that action leads to. Returning at the moment the click is dispatched leaves the caller asserting against whichever page the browser happens to still be showing, which reads as a failure of the destination rather than of the wait.

#### Scenario: A form submission navigates

- **WHEN** a page object action submits a form whose outcome is a different page
- **THEN** the action returns only once the browser has reached that page
- **AND** a caller's next statement runs against the destination, not the origin

#### Scenario: The navigation never happens

- **WHEN** the browser does not reach the destination within the wait
- **THEN** the action fails naming the destination it waited for

### Requirement: A readiness wait reports its outcome to its caller

A component's readiness wait SHALL resolve to a boolean and its callers SHALL act on that boolean. A readiness wait that computes a result and discards it passes on a screen it was meant to reject, and moves the failure to a later, unrelated line.

#### Scenario: A readiness wait fails

- **WHEN** a caller invokes a component's readiness wait and the component is not ready
- **THEN** the wait resolves to false
- **AND** the caller fails at that point rather than continuing
