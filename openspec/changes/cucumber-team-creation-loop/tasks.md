## 1. `SpecificTeamFragment.waitForElements()` reports rather than raises

- [x] 1.1 In `business-logic/selenium/ui/pages/organizations/fragments/specific-team.fragment.ts`: `waitForElements()` now returns `Promise<boolean>` via `this.isVisible(this.locators.teamDetails)`. `waitUntilTeamDisplayed()` now calls `this.findElement(this.locators.teamDetails)` directly instead of `this.waitForElements()`, preserving its raise-on-absence behavior before polling the team name. Verified: `npm run typecheck` (root) and `npx eslint` on the file both clean; grepped for other callers of `waitForElements()` on this fragment - only the Cucumber loop's `await this.pages.orgSpecificTeam.waitForElements();` (discards the boolean, unaffected), Vitest never calls it directly. A real run of `--tags "@e2e"` (`services/gitea-selenium-cucumber`) passed 1 scenario / 7 steps.

## 2. `Organization` gains an optional `teams` list

- [x] 2.1 In `business-logic/selenium/api/entities/organization.entity.ts`, added `teams?: Team[]` (imported `Team` from `./team.entity`). Verified with `npm run typecheck` (root) and `npx eslint` on the file, both clean.

## 3. Loop the team-creation step, folding in the Teams-tab click

- [ ] 3.1 In `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`: rewrite `"I create the following teams:"` to iterate `dataTable.hashes()`; per row, call `orgFacade.navigateToTeamsTab()`, `orgTeams.clickNewTeamButton()`, `orgNewTeam.waitForElements()`, `orgNewTeam.createTeam(name, visibility, repoCodeAccess, createRepositories)`, `orgSpecificTeam.waitForElements()`, then push the row (as a `Team`, `permissions: "general"`) onto `scenarioState.organization!.teams` (initializing the array if unset). Remove the `'I navigate to the "Teams" tab'` step entirely. In `services/gitea-selenium-cucumber/features/scenarios/organizations.feature`, drop the `@e2e` scenario's now-redundant `And I navigate to the "Teams" tab` line. Verify with `npm run typecheck -w @gitea-automation/gitea-selenium-cucumber`, `npx eslint` on the edited file, and a real run of `--tags "@e2e"` confirming both table rows get created and land on their own team page in turn.

## 4. A `@smoke` scenario for team creation alone

- [ ] 4.1 Add a `Given` step (wording TBD at implementation) that seeds an organization through `OrganizationClient.createOrganization`, sets `scenarioState.organization`, then opens it with `this.pages.orgFacade.open()` + `this.pages.orgFacade.waitForElements()`. Add a `Then` step asserting `this.pages.orgSpecificTeam.waitForElements()` is `true`. Add the `@smoke`-tagged scenario itself to `organizations.feature`: login, the new `Given`, `When I create the following teams:` with a small table, `Then` the new assertion. Verify with `npm run typecheck -w @gitea-automation/gitea-selenium-cucumber`, `npx cucumber-js --dry-run --tags "@smoke"`, and a real run confirming it passes and the org is cleaned up afterward (`@cleanup` tag already on the feature).

## 5. Full verification

- [ ] 5.1 `npm run typecheck` and `npm run lint` clean across every workspace. Real run of `--tags "@organizations"` (covers both `@e2e` and the new `@smoke` scenario) passing, with no leftover organizations afterward. `services/gitea-selenium-vitest`'s `organizations.test.ts` still passes unmodified.
