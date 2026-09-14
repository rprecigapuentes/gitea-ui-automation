## Why

`organizations.steps.ts`'s "I create the following teams:" step ignores its own `DataTable` and creates one hardcoded team; Teams-tab navigation lives in a separate step even though it's really the first action of the per-team flow (create a team, land on its page, go back to Teams to create the next one). There's also no scenario that exercises team creation on its own, starting from an organization that already exists.

## What Changes

- `organizations.steps.ts`: "I create the following teams:" loops `dataTable.hashes()`, repeating per row: `orgFacade.navigateToTeamsTab()` → click "New Team" → wait for the form → `NewTeamFragment.createTeam(...)` → wait for the specific-team page. The separate `'I navigate to the "Teams" tab'` step is removed; `organizations.feature`'s `@e2e` scenario drops its now-redundant line.
- Each created team is appended to `scenarioState.organization.teams` as soon as its page confirms, not batched at the end.
- `Organization` gains an optional `teams?: Team[]`. `ScenarioState.team1`/`team2` (Vitest's own fields) are untouched.
- A new `@smoke` scenario creates teams starting from an already-existing organization (seeded through the API, then opened via `orgFacade.open()`), asserting the last-created team's page is displayed.
- `SpecificTeamFragment.waitForElements()` changes from a throwing `Promise<void>` to a `Promise<boolean>`, matching `OrgTeamsFragment`/`NewTeamFragment`'s existing shape, so the new scenario's `Then` can assert it directly.

### Out of scope

- `Team.permissions`: not settable through this flow (the form's permission radio is left at its default), so every team created here is recorded as `"general"`.
- Anything about `services/gitea-selenium-vitest` — its own team-creation flow already exists and is untouched.
- The `@smoke` scenario's `Then` is intentionally minimal (just the specific-team page's readiness) - richer assertions are a follow-up.

## Capabilities

### Modified Capabilities

- `page-objects`: a component's readiness wait reports success as a boolean rather than raising, extending the existing `isVisible`-reports-rather-than-raises requirement to the compound "wait for this component's elements" method every fragment already exposes.

## Impact

`business-logic/selenium/ui/pages/organizations/fragments/specific-team.fragment.ts`, `business-logic/selenium/api/entities/organization.entity.ts`; `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`. No change to `OrganizationFacade`'s constructor or to `services/gitea-selenium-vitest`.
