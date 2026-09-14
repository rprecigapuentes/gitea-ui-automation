## ADDED Requirements

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
