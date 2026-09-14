## Why

The `@e2e` scenario now needs a second membership action - add the second seeded user to just `qa-team` - that's the same click/type/verify/record/navigate sequence `"I add the first seeded user to every created team"` already has inline, just for one team instead of a loop over all of them. Duplicating that sequence into a second step would drift the two apart the first time either one needs a fix.

## What Changes

- `organizations.steps.ts` gets a private `addUserToTeam(world, user, teamName)` helper: navigate to the team, add the user, assert membership, record it on `Team.users`, return to Teams. Both the existing "every created team" step and a new one-team step call it.
- New step: `"I add the second seeded user to the {string} team"`.
- `organizations.feature`'s `@e2e` scenario adds `And I add the second seeded user to the "qa-team" team` after the existing bulk-add step.

## Impact

`services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`. No page-object changes - this only reshapes how the existing steps call the already-existing `OrganizationFacade`/`SpecificTeamFragment` methods.
