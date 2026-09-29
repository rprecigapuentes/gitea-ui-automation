## Why

`services/_shared/playwright/organizations.fixtures.ts`'s `seededUsers` fixture leaves "user 1"
behind on every run of the Cucumber `@e2e` scenario ("Change team members permissions"), in both
`playwright-native` and `playwright-bdd`, on every browser. The instance carried dozens of orphaned
`at-user-1-*` accounts going back to 2026-09-14. Reproduced directly against the API: Gitea's
`DELETE /admin/users/{username}` returns 422, `"user still has membership of organizations"`, for a
user still on an organization's roster. The scenario deliberately leaves "user 1" a member of
`qa-team` when it ends, while "user 2" is fully removed from every team by the scenario's last
steps — which is exactly the split between the accounts that leak and the one that never does.

## What Changes

- `OrganizationClient` gains `getOrganizationsForUser(username)` and `removeMember(organization,
username)`.
- `seededUsers`' teardown leaves every organization a seeded user is still a member of before
  deleting the user, so the delete succeeds regardless of what the scenario did or didn't undo, and
  regardless of whether this runs before or after the scenario's own organization gets deleted.

## Capabilities

No requirement text changes — a teardown correctness fix. `skip_specs: true`.

## Impact

Modified: `business-logic/clients/organizations.client.ts`,
`services/_shared/playwright/organizations.fixtures.ts`.
