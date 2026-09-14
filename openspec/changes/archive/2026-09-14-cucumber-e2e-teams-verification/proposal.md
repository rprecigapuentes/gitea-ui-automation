## Why

The `@e2e` scenario's `organizations.steps.ts` already has an unfinished `Then("the created teams are displayed in Teams page", ...)` (the user's own scaffolding, with the target locators pasted from the live DOM in comments) - it navigates back to the Teams tab but never reads or asserts anything.

## What Changes

- `OrgTeamsFragment` gains `getTeamNames(): Promise<string[]>`, scoped to the Teams tab's grid (`.ui.two.column.stackable.grid`, the parent the pasted HTML shows each `.team-item-box` living in) and built from the same `ownerTeamContainer`/`teamName` locators `hasTeamContainer` already uses - same scoped-container-then-children shape `NavBarFragment.getDropdownOrganizationsList()` already uses for the organization dropdown.
- The `Then` step calls it, asserts every team the scenario created (`scenarioState.organization.teams`) is in the list, and that the list's length is exactly that count plus one (the organization's own default "Owners" team, always present).

### Out of scope

- Anything about the `@smoke` scenarios - only `@e2e`'s final step is unfinished.

## Capabilities

None - reuses `isVisible`/`findElements`/`getText` exactly as `page-objects` already requires; no new page-object contract.

## Impact

`business-logic/selenium/ui/pages/organizations/fragments/org-teams.fragment.ts`; `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`.
