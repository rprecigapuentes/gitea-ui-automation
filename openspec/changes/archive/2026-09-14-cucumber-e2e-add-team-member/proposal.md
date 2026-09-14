## Why

The `@e2e` scenario creates two teams but never adds anyone to them. The seeded-users work already provisions extra Gitea accounts per run (`getSeededUser`) specifically so a scenario can log them in or, as here, add them as team members - nothing has consumed that yet.

## What Changes

- `Team` gains `users?: string[]`, populated as members are added, mirroring how `Organization.teams` is populated as teams are created.
- `SpecificTeamFragment` gains `addMemberByUsername(username)`: types the full username into the search box and clicks "add member" directly, skipping the dropdown-suggestion click `searchUsers()`/`selectUser()` go through - the search input is a plain `name="uname"` form field, so an exact username needs no suggestion click to submit.
- A new step adds the first seeded user to every team the scenario created, reusing `OrganizationFacade.navigateToSpecificTeam(name)` (click the team's own link, wait for its page) and `navigateToTeamsTab()` (return to the list) for each one - the same "click team → act → back to Teams" shape the team-creation loop already established, now reused for a different action per team.

### Out of scope

- Any change to Vitest's own add-member flow (`searchUsers`/`selectUser`/`addSelectedUser`) - `addMemberByUsername` is additive, not a replacement.

## Capabilities

None - reuses existing `OrganizationFacade`/`SpecificTeamFragment` methods and `BaseComponent` primitives; no new page-object contract.

## Impact

`business-logic/selenium/api/entities/team.entity.ts`, `business-logic/selenium/ui/pages/organizations/fragments/specific-team.fragment.ts`; `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`.
