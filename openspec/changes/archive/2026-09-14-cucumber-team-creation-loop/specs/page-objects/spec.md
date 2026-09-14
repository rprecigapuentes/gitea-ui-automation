## ADDED Requirements

### Requirement: A component's readiness wait reports rather than raises

A page object or fragment's "wait for this component's elements" method SHALL report readiness as a boolean, built on `isVisible`, rather than raising when the component hasn't rendered - the same reporting contract `isVisible` itself already follows.

#### Scenario: The component has rendered

- **WHEN** a caller awaits a component's readiness wait after it has rendered
- **THEN** it resolves to `true`

#### Scenario: The component has not rendered

- **WHEN** a caller awaits a component's readiness wait before it has rendered
- **THEN** it resolves to `false` rather than raising
