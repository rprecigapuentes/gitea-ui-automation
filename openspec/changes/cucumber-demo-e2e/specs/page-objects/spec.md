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
