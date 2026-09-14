## ADDED Requirements

### Requirement: An action whose outcome is a navigation waits for that navigation

A page object action that submits a form or follows a link SHALL NOT return until the browser has reached the page that action leads to. Returning at the moment the click is dispatched leaves the caller asserting against whichever page the browser happens to still be showing, which reads as a failure of the destination rather than of the wait.

#### Scenario: A form submission navigates

- **WHEN** a page object action submits a form whose outcome is a different page
- **THEN** the action returns only once the browser has reached that page
- **AND** a caller's next statement runs against the destination, not the origin

#### Scenario: The navigation never happens

- **WHEN** the browser does not reach the destination within the wait
- **THEN** the action fails naming the destination it waited for

### Requirement: A composite readiness check waits for its condition

A readiness check that compares several values SHALL retry the whole comparison until it holds or its wait expires, rather than resolving the elements once and comparing their values once. An element that is displayed has not necessarily finished rendering the text and the state the check reads from it, so a single sample of a still-settling screen reports a failure that a second look would not.

#### Scenario: The screen is still settling

- **WHEN** a composite readiness check runs while the component is rendered but its values have not settled
- **THEN** the check keeps comparing until the values hold or its wait expires
- **AND** it reports true if they settle within the wait

#### Scenario: The condition never holds

- **WHEN** the compared values never reach what the check expects
- **THEN** the check reports false rather than raising
- **AND** the run log names each compared value and what it resolved to

### Requirement: A readiness wait reports its outcome to its caller

A component's readiness wait SHALL resolve to a boolean and its callers SHALL act on that boolean. A readiness wait that computes a result and discards it passes on a screen it was meant to reject, and moves the failure to a later, unrelated line.

#### Scenario: A readiness wait fails

- **WHEN** a caller invokes a component's readiness wait and the component is not ready
- **THEN** the wait resolves to false
- **AND** the caller fails at that point rather than continuing
