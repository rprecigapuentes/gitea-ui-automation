## 1. `SpecificTeamFragment.waitForElements()` reports rather than raises

- [x] 1.1 In `business-logic/selenium/ui/pages/organizations/fragments/specific-team.fragment.ts`: `waitForElements()` now returns `Promise<boolean>` via `this.isVisible(this.locators.teamDetails)`. `waitUntilTeamDisplayed()` now calls `this.findElement(this.locators.teamDetails)` directly instead of `this.waitForElements()`, preserving its raise-on-absence behavior before polling the team name. Verified: `npm run typecheck` (root) and `npx eslint` on the file both clean; grepped for other callers of `waitForElements()` on this fragment - only the Cucumber loop's `await this.pages.orgSpecificTeam.waitForElements();` (discards the boolean, unaffected), Vitest never calls it directly. A real run of `--tags "@e2e"` (`services/gitea-selenium-cucumber`) passed 1 scenario / 7 steps.

## 2. `Organization` gains an optional `teams` list

- [x] 2.1 In `business-logic/selenium/api/entities/organization.entity.ts`, added `teams?: Team[]` (imported `Team` from `./team.entity`). Verified with `npm run typecheck` (root) and `npx eslint` on the file, both clean.

## 3. Loop the team-creation step, folding in the Teams-tab click

- [x] 3.1 In `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`: `"I create the following teams:"` now iterates `dataTable.hashes()`; per row it calls `orgFacade.navigateToTeamsTab()`, `orgTeams.clickNewTeamButton()`, `orgNewTeam.waitForElements()`, `orgNewTeam.createTeam(name, visibility, repoCodeAccess, createRepositories)`, `orgSpecificTeam.waitForElements()`, `orgNavigation.waitForElements()`, then pushes the row (as a `Team`, `permissions: "general"`) onto `scenarioState.organization!.teams` (initialized on first use). Removed the `'I navigate to the "Teams" tab'` step entirely; `organizations.feature`'s `@e2e` scenario dropped its now-redundant line. Verified: `npm run typecheck -w @gitea-automation/gitea-selenium-cucumber` and `npx eslint` on the edited file both clean; `--dry-run --tags "@e2e"` matched all 6 steps with none undefined; a real run of `--tags "@e2e"` passed 1/1, and a temporary debug log (added, checked, removed) confirmed both `team-1` and `team-2` are actually created and pushed (`organization.teams.length` reaching 2). A full `--tags "@organizations"` run (covers `@e2e` and `@smoke`) passed 2 scenarios / 10 steps.

## 4. A `@smoke` scenario for team creation alone

- [ ] 4.1 Add a `Given` step (wording TBD at implementation) that seeds an organization through `OrganizationClient.createOrganization`, sets `scenarioState.organization`, then opens it with `this.pages.orgFacade.open()` + `this.pages.orgFacade.waitForElements()`. Add a `Then` step asserting `this.pages.orgSpecificTeam.waitForElements()` is `true`. Add the `@smoke`-tagged scenario itself to `organizations.feature`: login, the new `Given`, `When I create the following teams:` with a small table, `Then` the new assertion. Verify with `npm run typecheck -w @gitea-automation/gitea-selenium-cucumber`, `npx cucumber-js --dry-run --tags "@smoke"`, and a real run confirming it passes and the org is cleaned up afterward (`@cleanup` tag already on the feature).

## 5. Full verification

- [ ] 5.1 `npm run typecheck` and `npm run lint` clean across every workspace. Real run of `--tags "@organizations"` (covers both `@e2e` and the new `@smoke` scenario) passing, with no leftover organizations afterward. `services/gitea-selenium-vitest`'s `organizations.test.ts` still passes unmodified.
