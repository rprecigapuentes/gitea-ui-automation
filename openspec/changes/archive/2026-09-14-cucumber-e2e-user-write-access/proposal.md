## Why

`@e2e` never proves that a team's `write` code access actually lets its members write to a repo. Having user 1 (a `dev-team` member) log in, open the repo the owner already put a file in, and add a file of their own closes that gap - reusing the exact steps built for the owner's file, generalized to read the current session's own username instead of hardcoding the owner's.

Confirmed live: once a repo already has a file, "New File" moves from a direct link into a dropdown (`.repo-add-file`) - the class-based locator given for this task. Composing the existing steps in a new order surfaced a real, pre-existing bug: `OrganizationFacade` cached the last tab it navigated to in a mutable `currentUrl` and reused it for `open()`, so reopening the org after `navigateToTeamsTab()` had run silently landed back on the Teams page instead of the org root - `open()` now always computes the org's root URL fresh.

## What Changes

- `RepoCodeTabFragment.clickNewFileButton()`/`waitForElements()` handle both the direct-link and dropdown states of "New File".
- `NavBarFragment` gains `getCurrentUsername()` (reads the account avatar's `title`) and `clickSignOut()`.
- `Repository` gains `files?: string[]`; `"I add a file to each repository"`/`"the file count for each repository is correct"` now work for whoever is logged in (not just the owner) and assert against the tracked file count instead of a hardcoded `1`.
- New `Given "I login with valid credentials as user {int}"` and `When "I logout"` steps.
- `OrganizationFacade.getUrl()` always returns the org's root URL - no more stale `currentUrl`.
- `"I remove the following team members:"` navigates to the Teams tab itself now, instead of assuming the prior step already left the browser there.
- `@e2e`: after assigning `monorepo` to both teams, user 1 logs out the owner, logs in, opens the org, adds their own file, and the count is checked again - then logs back out and the owner logs back in before the existing member-removal step.

## Impact

`business-logic/selenium/api/entities/repository.entity.ts`; `business-logic/selenium/ui/pages/common/fragments/nav-bar.fragment.ts`; `business-logic/selenium/ui/pages/repositories/fragments/repo-code-tab.fragment.ts`; `business-logic/selenium/ui/pages/organizations/facade/organization.facade.ts`; `services/gitea-selenium-cucumber/features/step-definitions/login.steps.ts`, `organizations.steps.ts`, `features/scenarios/organizations.feature`.
