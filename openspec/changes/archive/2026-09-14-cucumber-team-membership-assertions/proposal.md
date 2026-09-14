## Why

The `@e2e` scenario adds members to teams but never asserts the Teams-tab list actually reflects it - member counts and avatars stay unverified.

## What Changes

- `OrgTeamsFragment` gains `getTeamAvatarUsernames(teamName): Promise<string[]>`, extracting each avatar's `title` attribute (already what `hasTeamAvatar` does for one username) - `hasTeamAvatar` is refactored to call it instead of duplicating the extraction.
- Two new `Then` steps, both looping `scenarioState.organization.teams` (already tracking each team's `users`, no new input needed): one asserts `getTeamMembersCount` matches `users.length`, the other asserts `getTeamAvatarUsernames` matches `users` exactly (contents and count).
- Wired into the `@e2e` scenario after the team-members step.

## Impact

`business-logic/selenium/ui/pages/organizations/fragments/org-teams.fragment.ts`; `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`.
