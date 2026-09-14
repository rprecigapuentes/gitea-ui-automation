## Why

Teams are created and get members, but no repository is ever assigned to them - a gap in the org e2e flow, and a precondition for later permission checks. Confirmed live on the team's Repositories tab: `.org-team-navbar a[href$='/repositories']` switches into it, the search input (`input[name='repo_name']`) plus `form[action$='/repo/add'] button` add a repo by name, and the assigned list lives in `.ui.attached.segment:has(.flex-divided-list)` - a plain `.ui.attached.segment` also matches the search form's own segment, so `:has()` is needed to land on the list one. Each entry's link text is `{org}/{repo}`.

## What Changes

- `Team` gains `repositories?: string[]`.
- `SpecificTeamFragment` gains `navigateToRepositoriesTab()`, `addRepository()`, `hasAssignedRepository()`, `getAssignedRepositoryNames()`.
- A new `"I add the following repositories to each team:"` step assigns repos to teams and tracks it in state; `"the repositories assigned to each team are correct"` asserts each team's assigned list matches.
- `@e2e`: dev-team's repo code access moves from `none` to `write` (needed to hold a repo with write access), frontend goes to dev-team, both repos go to qa-team.

## Impact

`business-logic/selenium/api/entities/team.entity.ts`; `business-logic/selenium/ui/pages/organizations/fragments/specific-team.fragment.ts`; `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`.
