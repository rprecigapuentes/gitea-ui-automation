## Why

The `@e2e` scenario has never touched repositories. This starts that: navigate to the org's Repositories tab, open the new-repository form, and fill it - deliberately stopping short of submitting, since the page the submit would land on doesn't have its own `waitForElements()` yet (a follow-up change).

## What Changes

- `Repository` (`repository.entity.ts`) gains `visibility?: boolean` and its `id` becomes optional - the existing API-response usage (`RepositoryClient`) always has a real `id` at runtime and never reads `.visibility`, so both are safe wideners. `Organization` gains `repositories?: Repository[]`, mirroring `teams?: Team[]`.
- `OrgRepositoriesFragment` gains `clickNewRepositoryButton()` (the `newRepositoryButton` locator already existed, unused until now).
- `OrganizationFacade.navigateToRepositoriesTab()` waits for `reposFragment.waitForElements()` after navigating, matching `navigateToTeamsTab()`'s existing shape - it didn't wait for anything before.
- `CreateRepositoryPage` (the user's own new page, already has locators and `waitForElements()`) gains `enterRepositoryName(name)` and `setPrivate(isPrivate)` - no prior fill interaction existed for this page.
- Two new steps: `"I navigate to the repositories tab"` and `"I create the following repository:"` (click new, wait, fill name + visibility, record on `Organization.repositories` - no submit).

### Out of scope

- Clicking "create repository" or anything about the page it lands on - deferred until that page's own `waitForElements()` exists.

## Impact

`business-logic/selenium/api/entities/repository.entity.ts`, `business-logic/selenium/api/entities/organization.entity.ts`, `business-logic/selenium/ui/pages/organizations/fragments/org-repositories.fragment.ts`, `business-logic/selenium/ui/pages/organizations/facade/organization.facade.ts`, `business-logic/selenium/ui/pages/repositories/create-repository.page.ts`; `services/gitea-selenium-cucumber/features/support/page.factory.ts`, `features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`.
