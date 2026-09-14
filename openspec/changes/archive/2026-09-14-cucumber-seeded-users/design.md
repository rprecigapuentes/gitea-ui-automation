## Context

Confirmed live against the local Gitea instance: the owner tokens (`GITEA_TOKEN_<BROWSER>`) lack the `write:admin` scope Gitea requires for `POST /admin/users` (403, `required=[write:admin]`). The user added `GITEA_ADMIN_USERNAME`/`GITEA_ADMIN_PASSWORD`/`GITEA_ADMIN_TOKEN` to `.env`; a probe with `GITEA_ADMIN_TOKEN` against `POST /admin/users` and `DELETE /admin/users/{username}` returned 201 and 204 - this account can create and delete users.

`hooks.ts` already has the exact shape this needs: `BeforeAll` clears leftover organizations before any scenario, and `seededName(prefix)` already produces browser-unique, collision-proof names (`at-${prefix}-${BROWSER}-${uniqueSuffix()}`) for exactly this reason.

## Goals / Non-Goals

**Goals:**

- Two extra real Gitea users exist for the whole run, created once, not per scenario.
- A 3-browser parallel run produces 6 users total (2 per browser process), never colliding.
- They're deleted when the run ends, pass or fail.
- Their credentials are retrievable by a step definition that isn't written yet.

**Non-Goals:**

- Logging them in or exercising any UI with them - that's a later change.
- A generic multi-user provisioning framework - two users, fixed at this scale.

## Decisions

**`GITEA_ADMIN_TOKEN` has no per-browser suffix, unlike `GITEA_TOKEN_<BROWSER>`.** The admin account is one shared identity across all three browser processes; only the _users it creates_ need to be browser-unique, which `seededName`'s existing suffixing already guarantees. `resolveAdminToken()` mirrors `resolveOwnerToken()`'s shape (read, throw a named error if missing) without the per-browser lookup.

**`createUser`/`deleteUser` go on the existing `UserClient`, not a new `AdminClient`.** Every client in this codebase (`OrganizationClient`, `RepositoryClient`, ...) is a thin, stateless wrapper - which token a caller constructs it with is the caller's concern, not the client's. `UserClient` already models "operations about a user"; these two just need the caller to build it with `resolveAdminToken()` instead of `resolveOwnerToken()`.

**The store and its create/delete functions live in a new `features/support/seeded-users.ts`, not inside `hooks.ts` itself.** `hooks.ts` calls `createSeededUsers()`/`deleteSeededUsers()` the same way it already calls `ownerClients()`'s methods; a step definition that needs a user later imports `getSeededUser(index)` from the same module. Putting the store in `hooks.ts` would work too, but step definitions don't otherwise import from `hooks.ts`, and a dedicated module names its own purpose.

**The store is a module-level array, not something on `GiteaWorld`.** `BeforeAll`/`AfterAll` run outside any `GiteaWorld` instance (each scenario gets its own, built fresh in `Before`), so there's no per-scenario object to hold run-lifetime state. A module-level variable, populated once and read by any later import, is the same pattern `DriverFactory`'s static singleton already uses for a different piece of process-lifetime state.

**Password is a fixed literal (`"Passw0rd!123"`, the same one the live probe used successfully) shared by both seeded users.** They're throwaway test accounts scoped to one run; nothing about this task calls for per-user passwords.

## Risks / Trade-offs

- **[Risk]** `GITEA_ADMIN_TOKEN` is a single shared secret across all three parallel browser processes - if one process's `AfterAll` deletion logic had a bug that deleted more than its own users, it could affect the other two. **Mitigation**: `deleteSeededUsers()` only ever iterates its own module-level `seededUsers` array, populated by that same process's `createSeededUsers()` call - there's no cross-process list to over-delete from.
- **[Risk]** A crashed run (process killed before `AfterAll`) leaves its 2 users behind. **Mitigation**: same residual-leftover risk `organizations.client.ts` already accepts for orgs (mitigated there by `deleteAllOrganizations()` in `BeforeAll`); explicitly out of scope for this change per the proposal, revisit if it becomes a real problem.

## Migration Plan

Implemented on `rene/83-add-org-e2e-test`. Verified with a real run before anything is committed, per the user's explicit instruction for this task; no commit is made until they've reviewed it working.
