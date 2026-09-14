## Why

Scenarios that need a second and third real Gitea account (not just the "owner" from `.env`) currently have none available in the Cucumber service - Vitest has a fixed `GITEA_INV_<BROWSER>` pre-seeded account, but Cucumber has nothing, and future scenarios will need to log those accounts in and drive the UI as them. Creating them ad hoc per scenario would be wasteful (they're meant to be reused across a run) and leaves cleanup unaddressed.

## What Changes

- `UserClient` gains `createUser(username, email, password)` and `deleteUser(username)`, calling Gitea's admin user endpoints (`POST /admin/users`, `DELETE /admin/users/{username}`) - these require a token with the `write:admin` scope, unlike every other call this client (or any other client in this codebase) makes.
- `credentials.ts` gains `resolveAdminToken()`, reading the new `GITEA_ADMIN_TOKEN` env var (already added to `.env`, not per-browser like the owner token since the created users are already made unique per browser).
- A new `features/support/seeded-users.ts` creates 2 users (named `at-user-<n>-<browser>-<suffix>`, same uniqueness convention `hooks.ts` already uses for organizations) in a process-wide `BeforeAll`, and deletes them in `AfterAll`. A `getSeededUser(index)` getter exposes their username/password to any step definition that needs to log in as one later.
- `hooks.ts` wires `createSeededUsers()`/`deleteSeededUsers()` into its existing `BeforeAll`/a new `AfterAll`.

### Out of scope

- Actually logging a seeded user in or driving the UI as one - `getSeededUser()` exists so a later change can, but no step definition uses it yet.
- Any change to `services/gitea-selenium-vitest` - its own `GITEA_INV_<BROWSER>` fixed account is untouched.
- Sweeping leftover seeded users from a previous crashed run (the way `organizations.client.ts`'s `deleteAllOrganizations()` does for orgs) - each run's users are uniquely named and torn down by that same run's `AfterAll`; a leftover sweep is a reasonable follow-up, not needed for this to work.

## Capabilities

### New Capabilities

- `cucumber-seeded-users`: what a Cucumber run guarantees about the extra Gitea accounts it creates for itself - they exist for the whole run, are unique per browser (so a 3-browser parallel run creates 6, not 3, with no collisions), and are gone once the run ends.

## Impact

`business-logic/selenium/api/clients/user.client.ts`; `services/gitea-selenium-cucumber/features/support/credentials.ts`, `hooks.ts`, and a new `features/support/seeded-users.ts`. No change to `services/gitea-selenium-vitest`.
