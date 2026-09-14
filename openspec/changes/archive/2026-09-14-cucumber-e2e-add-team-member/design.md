## Context

`OrganizationFacade.navigateToSpecificTeam(teamName)` already clicks the team's own link (`OrgTeamsFragment.clickTeamName`, scoped to that team's container, targeting `teamNameLink`'s `href`) and waits for its page (`waitUntilTeamDisplayed`) - exactly "click en sus tags a/href" plus a wait. `SpecificTeamFragment.addSelectedUser()` already clicks the add button and waits for `teamMemberUsernames` to render, confirming the add landed. The only missing piece is getting a username into the search box without the dropdown-suggestion detour Vitest's flow uses.

## Decisions

**`addMemberByUsername` types directly via the inherited `type()`, not `searchUsers()`.** `searchUsers()` also waits for `#search-user-box .results .result` to render - a real UI affordance for a partial query, but unnecessary (and unverified-safe) for a full, exact username meant to be typed and submitted, which is what was asked for.

**The step loops `scenarioState.organization.teams` rather than taking a `DataTable` or a fixed team name.** Every team the scenario created is already recorded there (from the team-creation-loop change); reusing it means the step works unchanged regardless of how many teams a future scenario creates, and needs no new scenario-state field beyond `Team.users`.

## Migration Plan

Implemented on `rene/83-add-org-e2e-test`. Verified with a real run before anything is committed; no commit without authorization.
