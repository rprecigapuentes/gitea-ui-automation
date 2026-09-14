## ADDED Requirements

### Requirement: A component reports whether a menu offers an option, having opened the menu first

A fragment wrapping a menu whose options are rendered only while it is open SHALL expose a report of whether the menu offers a given option, and that report SHALL open the menu before it looks. The look itself SHALL be the instant, non-waiting `isVisible` the absence-check contract already requires, so that an option the menu genuinely does not offer is reported as absent rather than waited for.

#### Scenario: The menu offers the option

- **WHEN** a caller asks whether a menu offers an option that it renders
- **THEN** the report is true
- **AND** the menu was opened before the option was looked for

#### Scenario: The menu does not offer the option

- **WHEN** a caller asks whether a menu offers an option it does not render
- **THEN** the report is false
- **AND** the report resolves without waiting out a timeout

#### Scenario: The menu is already open

- **WHEN** a caller asks whether an already-open menu offers an option
- **THEN** the report does not close the menu by toggling it
- **AND** the report is the same as it would be had the menu been closed

### Requirement: A two-way state action exposes both of its directions

Where a page object drives a control that moves the application between two states, it SHALL expose one method per direction rather than a single method for the direction a scenario happened to need first. Each direction SHALL resolve only once the reloaded or re-rendered page shows the state it moved to, and SHALL NOT resolve on the click returning.

#### Scenario: A scenario drives one direction

- **WHEN** a page object's method for one direction of a two-way state is called
- **THEN** it resolves only once the page renders that state
- **AND** a scenario asserting the state immediately afterwards reads the state the action produced

#### Scenario: A scenario drives the opposite direction

- **WHEN** the opposite direction is called on the same page object
- **THEN** it is a method of its own, named for the direction it drives
- **AND** it resolves only once the page renders the state it moved to

### Requirement: A tab navigation resolves on the address it reaches

A page object or fragment that moves between the tabs of a screen SHALL treat the address the browser ends up on as the outcome of that move, and SHALL NOT resolve on the click alone. Where the tab bar is rendered by a component that rebuilds its items after the page loads, a click that produced no navigation SHALL be repeated before the move is reported as failed, since the first one can land on a node the rebuild then replaces.

#### Scenario: The click navigates

- **WHEN** a caller moves to a tab and the click navigates
- **THEN** the move resolves only once the browser is at that tab's address

#### Scenario: The click is swallowed by a rebuilding tab bar

- **WHEN** a caller moves to a tab and the first click leaves the browser where it was
- **THEN** the click is made again
- **AND** the move resolves once the browser reaches that tab's address

#### Scenario: The tab is never reached

- **WHEN** no attempt leaves the browser at the tab's address
- **THEN** the move fails rather than reporting a tab the browser is not on

### Requirement: A choice the page saves by itself is confirmed by what the page then lists

Where a control sends the choice to the server on its own, after the interaction that made it, the page object SHALL confirm the choice against what the screen lists as selected before resolving. It SHALL NOT treat the closing of the control as the save.

#### Scenario: The choice is saved

- **WHEN** a caller makes a choice in a control that saves it with a request of its own
- **THEN** the call resolves only once the screen lists that choice as selected

#### Scenario: The next step reads the result of the choice

- **WHEN** a later step reads a screen that reflects the choice
- **THEN** it reads a screen the save has already reached
