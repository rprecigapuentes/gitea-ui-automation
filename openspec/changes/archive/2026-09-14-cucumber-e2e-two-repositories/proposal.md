## Why

Two review comments on the last change, plus the natural next step: create more than one repository, the same way team creation already loops a `DataTable`.

## What Changes

- Review: `CreateRepositoryPage.enterRepositoryName` + `setPrivate` + `clickCreateRepositoryButton` collapse into one `createRepository(name, isPrivate)`, mirroring `NewTeamFragment.createTeam`.
- Review: `hooks.ts`'s `@cleanup` hook merges its two repository-deletion loops (`scenarioState.repositories`, `organization.repositories`) into one, over both arrays' names combined.
- `"I create the following repository:"` becomes `"I create the following repositories:"`, looping every row (`frontend`, `backend`): create, assert the title inline per repository, then click the organization link in the title breadcrumb to get back to the Repositories tab before the next row - the same "create, land, come back" shape team creation already uses. `RepoNavBarFragment` gains `clickOrganizationLink()` for that (the breadcrumb's first link, confirmed against the live DOM captured for the title work).
- The old separate title-check `Then` is replaced by `Then("the repositories were created successfully", ...)`, comparing `organization.repositories.length` against `OrgRepositoriesFragment.getOwnersRepositoriesCount()` (already existing, confirmed live it reflects every repository the org owns) - no new locator needed for it.

## Impact

`business-logic/selenium/ui/pages/repositories/create-repository.page.ts`, `fragments/repo-nav-bar.fragment.ts`; `services/gitea-selenium-cucumber/features/support/hooks.ts`, `features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`.
