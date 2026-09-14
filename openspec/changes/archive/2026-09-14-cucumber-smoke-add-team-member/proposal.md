## Why

There's no `@smoke` scenario for adding a member to a team on its own - only the full `@e2e` flow exercises it, mixed in with org and multi-team creation.

## What Changes

- A new `@smoke` scenario, "Add a user to a team": starts from an already-existing organization (`Given an organization already exists`), creates one team, adds one seeded user to it, and asserts the member count and avatar. Every step it uses already exists (`organizations.feature`'s other scenarios and the `@e2e` scenario already exercise each one) - no new step definitions or page-object methods.

## Impact

`services/gitea-selenium-cucumber/features/scenarios/organizations.feature` only.
