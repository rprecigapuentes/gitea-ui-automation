# page-objects Specification

## Purpose

Defines what a page object and a page fragment must be able to report about their own visibility, how that report is derived from the elements each one declares, and in what order a component's presence and absence checks are evaluated.

## Requirements

### Requirement: Every page object and page fragment reports its own visibility

A page object and a page fragment SHALL each expose one visibility predicate, named `isVisible`, returning whether the component is present and correct on the current screen. The framework SHALL provide a default implementation derived from the elements the component declares as its ready elements, so that a component declaring ready elements and no predicate body of its own still answers. A component SHALL NOT expose a second predicate under another name for the same question.

#### Scenario: A component that declares ready elements inherits its answer

- **WHEN** a page object or page fragment declares ready elements and defines no visibility predicate of its own
- **THEN** its visibility predicate reports true once every declared ready element is displayed
- **AND** it reports false when any declared ready element is absent

#### Scenario: A component verifies more than the presence of its elements

- **WHEN** a component must also check element text, an attribute or the absence of an element to consider itself correct
- **THEN** it extends the inherited predicate rather than replacing the framework's name for it
- **AND** the caller invokes the same predicate name it would invoke on any other component

#### Scenario: A component declares no ready elements

- **WHEN** a component declares no ready elements and defines no visibility predicate of its own
- **THEN** its visibility predicate reports false rather than reporting a vacuous true

### Requirement: The visibility predicate reports rather than raises

The visibility predicate SHALL report its outcome as a boolean and SHALL NOT raise when the component is absent. The framework SHALL log the locator that failed and the state of the page at that moment, so that a caller reading a false result can identify the missing element from the run log.

#### Scenario: A component is not on screen

- **WHEN** the visibility predicate runs against a screen the component is not on
- **THEN** it reports false
- **AND** the run log names the locator that was not found and the page the browser was on

### Requirement: Absence checks are evaluated only after the component is confirmed present

A component whose verification includes the absence of an element SHALL confirm its ready elements before evaluating that absence. An absence check SHALL NOT be evaluated concurrently with the presence checks of the same component, because an element that has not yet rendered is indistinguishable from one that is genuinely absent.

#### Scenario: The component has not finished rendering

- **WHEN** a component's verification includes an absence check and the component has not yet rendered
- **THEN** the absence check does not report a satisfied absence
- **AND** the verification reports false rather than passing on an unrendered screen

#### Scenario: The element is genuinely absent

- **WHEN** a component's ready elements are confirmed and the element under the absence check is not on the screen
- **THEN** the absence check reports a satisfied absence
- **AND** the verification reports true

### Requirement: Opening a page waits for the same elements its visibility predicate checks

A page object SHALL declare its ready elements once, and SHALL use that one declaration both as its post-navigation wait and as the basis of its visibility predicate, so the two cannot disagree about what anchors the page. A predicate that verifies more than the ready elements SHALL build on that declaration rather than restate it. A page that declares no ready elements SHALL navigate without waiting for any element.

#### Scenario: A page with ready elements is opened

- **WHEN** a page object that declares ready elements is opened
- **THEN** navigation completes only once every declared ready element is displayed

#### Scenario: A page without ready elements is opened

- **WHEN** a page object that declares no ready elements is opened
- **THEN** navigation completes without waiting for any element
