## Purpose

Defines how the Playwright suite checks a rendered Gitea page against a recorded screenshot, including at which viewport sizes a page is checked.

## ADDED Requirements

### Requirement: Phone-width visual check

The visual suite SHALL be able to check a page's screenshot against a baseline while the browser's viewport is narrowed to a phone width, in addition to the desktop-width checks the suite already performs.

#### Scenario: Main view checked at a phone width

- **WHEN** the phone-width main-view visual spec runs
- **THEN** it signs in, asserts the main view has loaded, and compares a screenshot taken while the page is rendered at a phone-width viewport against its own baseline

### Requirement: Viewport override scoped to the spec that needs it

A spec that renders at a non-default viewport SHALL NOT change the viewport used by any other spec in the same Playwright project.

#### Scenario: Desktop specs unaffected by a phone-width spec

- **WHEN** the phone-width main-view spec and the desktop main-view spec both run in the same visual project
- **THEN** the desktop spec's page is rendered at the project's configured desktop viewport, unchanged by the phone-width spec's override
