## Context

The user's own scaffolding in `organizations.steps.ts` already pastes the live DOM: a `<div class="ui two column stackable grid">` whose direct children are `.column.team-item-box` cards - already matched by `OrgTeamsFragment.locators.ownerTeamContainer` (`.team-item-box`), each card's name already matched by `locators.teamName` (`.team-item-header a strong`). Both locators, and the pattern of scoping `findElements` to a container then reading each child's text, already exist and are already exercised (`hasTeamContainer`, `getTeamContainersCount`).

## Decisions

**`getTeamNames()` scopes through a new `teamsContainer` locator rather than searching `ownerTeamContainer` page-wide.** `.team-item-box` is distinctive enough that an unscoped search would work too, but scoping to the grid matches what the user asked for and what `getDropdownOrganizationsList()` already does for the analogous organizations-dropdown case - one consistent shape for "read every item's name out of a listing."

**The `Then` step asserts `teamNames.length === createdTeams.length + 1`, not just `toContain` for each name.** The scenario always starts from a freshly created organization, whose only teams are the automatic "Owners" team plus whatever the scenario itself created - so an exact count is deterministic here, not a source of flakiness, and it's what the user's own comment asked for ("un contain y un length").

## Migration Plan

Implemented on `rene/83-add-org-e2e-test`. Verified with a real run before anything is committed, per the user's instruction; no commit without authorization.
