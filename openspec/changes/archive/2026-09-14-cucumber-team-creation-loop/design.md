## Context

`organizations.feature`'s `@e2e` scenario already has a two-row `DataTable` (`name`, `visibility`, `repoCodeAccess`, `createRepo`) matching `NewTeamFragment.createTeam(name, visibility, repoCodeAccess, createRepositories)`'s exact signature - that method already fills the form and submits it in one call. `OrganizationFacade.navigateToTeamsTab()` and `OrgTeamsFragment.clickNewTeamButton()` already exist and are exactly what's needed to get back to the team-creation form after landing on the previous team's page. Nothing new needs to be added to the facade or fragments to drive the flow - only the step definition needs to actually use what's there, and `Team.permissions` stays unset by this flow (the form's permission radio has no UI action wired to it in `createTeam`, so every team lands with Gitea's own default).

## Goals / Non-Goals

**Goals:**

- "I create the following teams:" creates every row in the table, not just one hardcoded team.
- The Teams-tab click stops being its own step - it's the first action of each repetition, matching the real UI flow (create → land on the team's page → back to Teams → next team).
- Each created team is recorded on `scenarioState.organization.teams` as it's created, so a mid-loop failure still leaves a usable record of what succeeded.
- A `@smoke` scenario exercises team creation in isolation, without the full org-creation UI flow first.

**Non-Goals:**

- Changing what a team's `permissions` field can be, or exposing that radio through `createTeam`.
- Any change to Vitest's team-creation flow or to `OrganizationFacade`'s constructor.

## Decisions

**The loop lives entirely in `organizations.steps.ts`; no fragment or facade gains new methods.** Every action the loop needs (`orgFacade.navigateToTeamsTab()`, `orgTeams.clickNewTeamButton()`, `orgNewTeam.waitForElements()`, `orgNewTeam.createTeam(...)`, `orgSpecificTeam.waitForElements()`) already exists. Alternative considered: add a `createTeams(rows)` helper to the facade, mirroring `createTeam`. Rejected - the facade's own methods already compose cleanly at the step level, and a step that owns its own loop is easier to read than one that calls a facade method whose name hides a loop.

**Each team is pushed to `scenarioState.organization!.teams` right after its specific-team page is confirmed, inside the loop - not collected into an array and assigned once at the end.** This matches the "record it once it exists" principle already used for `scenarioState.organization` itself elsewhere in this file (set immediately after `createOrganization`, before the assertions that could fail).

**`Organization.teams?: Team[]`, not a new `ScenarioState.teams` field.** The user's own steer: teams belong to the organization that owns them, so that's the more coherent home; `ScenarioState.team1`/`team2` are Vitest's own fields for its own two-team scenario and are untouched by this change (Vitest doesn't read `Organization.teams`).

**The `@smoke` scenario's `Given` seeds the organization through the API (`OrganizationClient.createOrganization`, already used by `hooks.ts`'s `@project-board` seeding) and then opens it in the browser with `orgFacade.open()` + `orgFacade.waitForElements()` (both already exist on the facade - `open()` is `BasePage`'s inherited implementation).** Alternative considered: drive the existing UI-based "create organization" steps first, same as the `@e2e` scenario. Rejected per the user's own framing ("puedes empezar desde que ya existe una organización creada") - a `@smoke` scenario for team creation shouldn't also be re-proving organization creation; API seeding is faster and matches the precedent `@project-board` already set for "the org already exists, this scenario is about something else."

**`SpecificTeamFragment.waitForElements()` becomes `Promise<boolean>` (`isVisible(this.locators.teamDetails)`), and `waitUntilTeamDisplayed()` no longer calls it.** Today `waitForElements()` is `await this.findElement(...)` - it raises rather than reporting, unlike every other fragment's `waitForElements()` in this codebase. `waitUntilTeamDisplayed()` currently opens with `await this.waitForElements();` purely for its throw-on-absence side effect before polling the team's name; once `waitForElements()` stops throwing, that call is replaced with `await this.findElement(this.locators.teamDetails);` directly (the same wait, called by its own name) so `waitUntilTeamDisplayed`'s own contract - raise if the team never appears - is unchanged. Every other caller of `waitForElements()` (the new loop, the new scenario's `Then`) gets the boolean it expects.

## Risks / Trade-offs

- **[Risk]** `scenarioState.organization!.teams` uses a non-null assertion, same as every other step in this file that reads `scenarioState.organization` after it's been set earlier in the scenario - consistent with the file's existing style, not a new pattern.
- **[Risk]** The `@smoke` scenario's API-seeded organization is never cleaned up by a UI step, only by the `@cleanup` tag's existing `After` hook (keyed off `scenarioState.organization`, set either way) - no new cleanup path needed.

## Migration Plan

Implemented on `rene/83-add-org-e2e-test`, task by task - see tasks.md. Each task is reviewed and committed by the user individually; this change is not committed by the agent.
