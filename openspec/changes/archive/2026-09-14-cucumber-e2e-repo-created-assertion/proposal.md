## Why

`"I create the following repository:"` stops after filling the form - it never submits, so nothing confirms a repository actually gets created. The user's own new `RepoNavBarFragment`/`RepoCodeTabFragment` (the pages a repo lands on after creation, split into fragments the same way org pages are - one shared nav bar, tabs underneath) already have `waitForElements()`, but `RepoCodeTabFragment`'s "New File" button locator was a guess (`.ui.button.primary`) that doesn't match anything real - confirmed live, the actual element is `<a class="item" href="/{org}/{repo}/_new/{branch}/">`, a class far too generic to select on its own; only the href, which embeds the org and repo names, identifies it.

## What Changes

- `RepoCodeTabFragment.waitForElements(organizationName, repositoryName)` now takes both names and stores them (same shape as `OrganizationDashboardPage.waitForElements(organization)`), building the "New File" locator from that stored state (`a[href^="/{org}/{repo}/_new/"]`) instead of a hardcoded class.
- `RepoNavBarFragment` gains `getRepoTitle()`, reading the org/repo breadcrumb text (confirmed live: `"{org}/{repo}"`, via two child links) - no locator changes needed there, it already matched correctly.
- `CreateRepositoryPage` gains `clickCreateRepositoryButton()`. `"I create the following repository:"` now submits and waits for both repo fragments to confirm landing. A new `Then` asserts the repo's title contains the organization's name and the repository's name.
- Both fragments registered on `PageFactory`.

## Impact

`business-logic/selenium/ui/pages/repositories/fragments/repo-code-tab.fragment.ts`, `repo-nav-bar.fragment.ts`, `../create-repository.page.ts`; `services/gitea-selenium-cucumber/features/support/page.factory.ts`, `features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`.
