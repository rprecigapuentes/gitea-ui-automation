## Why

`@e2e` removes user 1 from `dev-team` but never proves they still have write access through `qa-team`, and never proves that lowering a team's code access to `read` actually revokes write access for its members. Closing both gaps: user 1 logs back in and adds another file (still works via `qa-team`), the owner drops `qa-team`'s code access to `read`, and user 2 (also on `qa-team`) confirms they can view the repo but get Gitea's fork-to-propose-changes prompt instead of the file editor when they try to add one.

Confirmed live: editing a team reuses the same form as creating one (same `unit_1` radios for code access), just posted to `.../teams/{name}/edit` instead of `.../teams/new` - and its "Update Settings" button needs the same form-scoping `createTeamButton` already uses, since a bare `.ui.primary.button` matches two buttons on that page. The fork prompt (`<h3>Fork Repository to Propose Changes</h3>` + a `Fork Repository` button) renders at the same `_new/` URL the file editor would have used.

## What Changes

- `SpecificTeamFragment` gains `clickSettingsButton()` (`.svg.octicon-gear`). `NewTeamFragment` gains `waitForEditElements()`/`clickUpdateTeamButton()`, reusing its existing `selectRepoCodeAccess()`.
- New `ForkPromptFragment` for the "Fork Repository to Propose Changes" page.
- New steps: `"I change the repository code access for {string} to {string}"`, `"I open the repository"`, `"I click the New File button"`, `"the fork repository prompt is displayed"`.
- `"I add a file to each repository"` now names the file `{username}-{uniqueSuffix}` instead of just `{username}` - the same user (re-)running this step would otherwise try to create a file that already exists.
- `@e2e`: after user 1 is removed from `dev-team`, they log back in and add another file (still writable via `qa-team`); the owner drops `qa-team`'s code access to `read`; user 2 opens the repo, tries to add a file, and gets the fork prompt instead.

## Impact

`business-logic/selenium/ui/pages/organizations/fragments/specific-team.fragment.ts`, `new-team.fragment.ts`; `business-logic/selenium/ui/pages/repositories/fragments/fork-prompt.fragment.ts` (new); `services/gitea-selenium-cucumber/features/support/page.factory.ts`, `features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`.
