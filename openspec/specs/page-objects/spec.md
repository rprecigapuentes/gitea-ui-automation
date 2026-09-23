# page-objects Specification

## Purpose

Defines what a page object and a page fragment must be able to report about their own visibility, how that report is derived from the elements each one declares, and in what order a component's presence and absence checks are evaluated.

## Requirements

### Requirement: A page object or page fragment reports its own visibility through explicit locators

A page object and a page fragment SHALL expose visibility checks through `isVisible`, which SHALL accept the locator or locators to check as an explicit argument rather than reading them from a property the component declares. A component with more than one shape of "visible" (for example, differing by the caller's role or by which page context it renders in) SHALL expose one distinctly-named predicate method per shape, each supplying its own locators to `isVisible`, rather than a single predicate branching internally on a parameter.

#### Scenario: A caller checks a set of locators

- **WHEN** a caller invokes `isVisible` with one locator or a list of locators
- **THEN** it reports true once every one of those locators is displayed
- **AND** it reports false when any of them is absent

#### Scenario: A component has more than one shape of "visible"

- **WHEN** a component's correctness differs by caller role or by page context
- **THEN** the component exposes one predicate method per shape, each named for what it checks
- **AND** no single predicate branches on a role or context parameter to decide which locators to check

#### Scenario: A caller checks no locators

- **WHEN** a caller invokes `isVisible` with an empty list of locators
- **THEN** it reports false rather than reporting a vacuous true

### Requirement: The visibility predicate reports rather than raises

The visibility predicate SHALL report its outcome as a boolean and SHALL NOT raise when the component is absent. The framework SHALL log the locator that failed and the state of the page at that moment, so that a caller reading a false result can identify the missing element from the run log.

#### Scenario: A component is not on screen

- **WHEN** the visibility predicate runs against a screen the component is not on
- **THEN** it reports false
- **AND** the run log names the locator that was not found and the page the browser was on

### Requirement: Absence checks are evaluated only after the component is confirmed present

A component whose verification includes the absence of an element SHALL confirm the locators it depends on before evaluating that absence, and SHALL NOT evaluate the absence check concurrently with those presence checks, because an element that has not yet rendered is indistinguishable from one that is genuinely absent. An absence check SHALL be an instant, non-waiting check of `isVisible`, negated, rather than a separately named operation.

#### Scenario: The component has not finished rendering

- **WHEN** a component's verification includes an absence check and the component has not yet rendered
- **THEN** the absence check does not report a satisfied absence
- **AND** the verification reports false rather than passing on an unrendered screen

#### Scenario: The element is genuinely absent

- **WHEN** the locators a component depends on are confirmed and the element under the absence check is not on the screen
- **THEN** the absence check reports a satisfied absence
- **AND** the verification reports true

### Requirement: Opening a page waits for the elements its caller specifies

A page object's navigation SHALL accept the locators to wait for after navigating as an explicit argument. A page that is opened with no locators SHALL navigate without waiting for any element.

#### Scenario: A page is opened with locators to wait for

- **WHEN** a page object is opened and given one or more locators to wait for
- **THEN** navigation completes only once every one of those locators is displayed

#### Scenario: A page is opened with no locators to wait for

- **WHEN** a page object is opened with no locators to wait for
- **THEN** navigation completes without waiting for any element

### Requirement: An organization-scoped page object resolves its organization lazily

A page object, fragment, or facade that acts on a specific organization SHALL obtain that organization from scenario state at the moment it is first used, not at the moment it is constructed. This lets a factory or fixture build the object before the organization exists (for example, before the scenario's own steps have created it), as long as nothing calls into the object until after the organization is available.

#### Scenario: The object is built before the organization exists

- **WHEN** an organization-scoped page object, fragment, or facade is constructed before scenario state holds an organization
- **THEN** construction succeeds
- **AND** no attempt is made to read the organization until the object is actually used

#### Scenario: The object is used after the organization is set

- **WHEN** an organization-scoped page object, fragment, or facade is used after scenario state holds an organization
- **THEN** it acts against that organization

#### Scenario: The object is used before the organization is set

- **WHEN** an organization-scoped page object, fragment, or facade is used while scenario state does not yet hold an organization
- **THEN** it raises rather than acting against an undefined organization

### Requirement: A component's readiness wait reports rather than raises

A page object or fragment's "wait for this component's elements" method SHALL report readiness as a boolean, built on `isVisible`, rather than raising when the component hasn't rendered - the same reporting contract `isVisible` itself already follows.

#### Scenario: The component has rendered

- **WHEN** a caller awaits a component's readiness wait after it has rendered
- **THEN** it resolves to `true`

#### Scenario: The component has not rendered

- **WHEN** a caller awaits a component's readiness wait before it has rendered
- **THEN** it resolves to `false` rather than raising

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
