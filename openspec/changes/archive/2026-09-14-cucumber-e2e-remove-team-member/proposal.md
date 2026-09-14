## Why

`@e2e` builds up team membership but never removes anyone. Adding that step surfaced a real bug in `removeTeamMemberButton`: confirmed live, every member row's remove button shares the same `data-modal='#remove-team-member'` id, so on a team with 2+ members the old unscoped locator matched more than one - the exact shape of the flaky failures already seen on this locator in Vitest. Each button also carries `data-modal-name="{username}"`, which scopes it correctly.

The remove confirmation modal is fetched over AJAX before it shows (`form-fetch-action` + `data-modal-form.url`), so its reveal can outlast even the already-bumped 10s wait under load - confirmed live: after a 10s timeout, the modal was already visible seconds later. Widened the wait and gave the step its own Cucumber timeout to match.

## What Changes

- `removeTeamMemberButton` becomes a per-username locator; `hasRemoveTeamMemberButton()`/`clickRemoveTeamMemberButton()` take a `username` and the modal wait grows 10s -> 20s.
- Vitest's two call sites pass `invited.username`.
- A new `"I remove the following team members:"` step (own 35s Cucumber timeout) removes user 1 from dev-team in `@e2e`, reusing the existing member-count `Then`.

## Impact

`business-logic/selenium/ui/pages/organizations/fragments/specific-team.fragment.ts`; `services/gitea-selenium-vitest/tests/organizations.test.ts`; `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`.
