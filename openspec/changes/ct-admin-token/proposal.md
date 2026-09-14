## Why

The Cucumber suite has failed on every CT run since `d0f2282` merged: its `BeforeAll` calls `createSeededUsers()`, which needs `GITEA_ADMIN_TOKEN`, and `ct.yml` never provides one. The run dies before a single scenario executes (`Missing admin API token (GITEA_ADMIN_TOKEN)`). The variable exists only in the author's local `.env`; the workflow was never updated alongside the code that started requiring it.

Nothing in CT can supply it today: `gitea-test` is a fresh container per job, so it holds no admin account, and a repository secret cannot carry a token for an instance that did not exist when the secret was written. The run has to mint the identity itself.

## What Changes

- `ct.yml` registers a dedicated `ct-admin` account **before** the three browser owners, so that Gitea's "first registered user of a fresh instance is an administrator" rule makes it the admin.
- The same step mints a token for `ct-admin` carrying the `write:admin` scope, masks it, and exports it as `GITEA_ADMIN_TOKEN`, alongside the existing per-browser `GITEA_TOKEN_<BROWSER>` exports.
- The step probes the minted token against an admin-only endpoint and fails the job with a named error if it is not actually privileged, rather than letting the suite discover it as a `BeforeAll` crash minutes later.
- The owner tokens keep their current scopes; none of them gains `write:admin`.
- `services/gitea-selenium-cucumber/README.md` documents `GITEA_ADMIN_TOKEN` in its `.env` list, which it omits today: the same gap that produced this bug, in the place a developer setting the suite up locally would hit it.

### Out of scope

- Any code change in `services/gitea-selenium-cucumber`, including `resolveAdminToken()`: the code is correct, the environment was missing. Only that service's README is touched.
- `ci.yml` and `bs.yml`: neither runs the Cucumber suite against an ephemeral Gitea.
- The eight Vitest failures in the same run (the 30s `testTimeout` and the `organizations` locator). They are unrelated to this change and need their own.
- Provisioning a second admin, or per-browser admin identities: one shared admin is what `resolveAdminToken()` already expects.

## Capabilities

### Modified Capabilities

- `pipeline`: gains the requirement that a job provisions every Gitea account and API token its suite needs, at the privilege that suite needs, and fails before the suite starts when it cannot.

## Impact

`.gitea/workflows/ct.yml` and `services/gitea-selenium-cucumber/README.md`. No source file, no test, no dependency changes. Local `.env` keeps its existing hand-set `GITEA_ADMIN_TOKEN` and is unaffected.
