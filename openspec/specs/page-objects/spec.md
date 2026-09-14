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
