## Why

`@e2e` proves write access follows team membership and that lowering a team's code access to `read` blocks writes, but never proves dropping it to `none` hides the Code tab entirely, nor that removing a member from every team they're in cuts off their access to the organization altogether. Closing both gaps: the owner drops `qa-team`'s code access to `none`, user 1 opens the repo and lands on Issues (no Code tab at all), the owner removes user 2 from `qa-team`, and user 2 confirms the organization no longer shows up in their navbar's organization dropdown.

Confirmed live: with no code access, Gitea drops the Code entry from the repo nav entirely and redirects straight to `/issues`, marking that tab's anchor `active item` - but `data-text` lives on the inner `<span>`, not the anchor, so the active-tab locator has to reach for `a.active.item span[data-text=Issues]` rather than combining both selectors on one element.

## What Changes

- `RepoNavBarFragment` gains `isCodeTabVisible()` and `isIssuesTabActiveByDefault()`.
- New steps: `"I view the repository"`, `"the Code tab is not visible"`, `"the Issues tab is displayed by default"`, `"the organization is no longer accessible"` (reuses `navBar.clickOrganizationsDropdown()`/`getDropdownOrganizationsList()`).
- `@e2e`: after the read-access check, the owner drops `qa-team` to `none`; user 1 sees Issues by default with no Code tab; the owner removes user 2 from `qa-team`; user 2 confirms the organization is gone from their navbar dropdown.

## Impact

`business-logic/selenium/ui/pages/repositories/fragments/repo-nav-bar.fragment.ts`; `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`.
