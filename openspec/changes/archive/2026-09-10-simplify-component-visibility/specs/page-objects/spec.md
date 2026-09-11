## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Every page object and page fragment reports its own visibility

**Reason**: This requirement described a single inherited `isVisible` sourced from a declared "ready elements" property, with components forbidden from exposing a second predicate under another name. That default and that restriction are both removed: `isVisible` now takes its locators explicitly, and a component with more than one shape of "visible" is expected to expose multiple named predicates.
**Migration**: See "A page object or page fragment reports its own visibility through explicit locators" below.

### Requirement: Opening a page waits for the same elements its visibility predicate checks

**Reason**: This requirement depended on a single shared ready-elements declaration that is removed; a page's post-navigation wait and its visibility check are separate explicit calls and are no longer guaranteed to agree by construction.
**Migration**: Pass the locators to wait for explicitly when opening a page. See "Opening a page waits for the elements its caller specifies".

## ADDED Requirements

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

### Requirement: Opening a page waits for the elements its caller specifies

A page object's navigation SHALL accept the locators to wait for after navigating as an explicit argument. A page that is opened with no locators SHALL navigate without waiting for any element.

#### Scenario: A page is opened with locators to wait for

- **WHEN** a page object is opened and given one or more locators to wait for
- **THEN** navigation completes only once every one of those locators is displayed

#### Scenario: A page is opened with no locators to wait for

- **WHEN** a page object is opened with no locators to wait for
- **THEN** navigation completes without waiting for any element
