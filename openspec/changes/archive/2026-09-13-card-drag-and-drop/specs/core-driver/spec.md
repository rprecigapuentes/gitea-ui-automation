## Purpose

Defines how a component drags one element onto another, how it decides whether that drag reached the server, and how it waits for a condition the application's own screen has to be re-read to answer.

## ADDED Requirements

### Requirement: A component drags an element onto another through the base component

A component SHALL perform a drag by naming the locator of the element to drag and the locator of the element to drop it on, and the base component SHALL resolve both at the moment of the drag. A component SHALL NOT build the gesture itself from the driver, and SHALL NOT hold an element resolved before the drag to use as its source or target.

#### Scenario: A component drags one element onto another

- **WHEN** a component names a source locator and a target locator
- **THEN** the base component resolves both, waiting for each to be displayed
- **AND** performs a pointer gesture that presses on the source, crosses the drag threshold, travels to the target and releases

#### Scenario: The screen was re-read between resolving and dragging

- **WHEN** a drag is performed after the screen it acts on has been re-read
- **THEN** the source and the target are resolved again as part of the drag
- **AND** no reference obtained before the re-read is used

### Requirement: A drag the browser driver does not complete is performed as its event sequence

The framework SHALL offer a second way to perform the same drag, by dispatching the sequence of events the page's own handlers listen for, for a browser driver that does not complete the drop. That sequence SHALL be defined in one place in the core, SHALL be the only code the framework runs inside the browser to drag, and SHALL exercise the page's own drag handlers rather than moving the element by any other means.

#### Scenario: The browser driver never completes the drop

- **WHEN** a pointer gesture leaves the element under the target without the application recording the move
- **THEN** the component performs the same drag as its event sequence
- **AND** the page's own drag handlers run

#### Scenario: The framework drags without a pointer gesture

- **WHEN** the event sequence is dispatched
- **THEN** it is the sequence defined in the core, with one shared data transfer across its events
- **AND** no other part of the framework defines a drag of its own

### Requirement: A component verifies an interaction against the state the application kept

A component whose interaction is saved by a request the application sends after it has already changed the screen SHALL verify that interaction against a re-read of the screen, and SHALL NOT report success from the state the interaction left behind. The base component SHALL offer re-reading the current screen, so that no page object calls the driver to navigate. Waiting for that verification to become true is the base component's existing act-and-wait-for-a-predicate, which this change reuses rather than duplicates.

#### Scenario: The screen changed before the application was asked

- **WHEN** an interaction changes the screen before the request that saves it is answered
- **THEN** the component re-reads the screen before deciding whether the interaction succeeded
- **AND** what it reports is the state the application kept

#### Scenario: A component re-reads the screen

- **WHEN** a component re-reads the screen it is on
- **THEN** it names the locators that prove the screen is back
- **AND** the re-read completes only once every one of them is displayed

#### Scenario: A component waits for the application to catch up

- **WHEN** a component needs the verification to become true rather than to be true at once
- **THEN** it expresses the retry as the act-and-wait-for-a-predicate the base component already offers
- **AND** it does not add a second way of waiting for a predicate
