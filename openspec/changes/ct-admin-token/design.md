## Context

See proposal.md - Why. The constraint that shapes everything below: CT's `gitea-test` is a `services:` container created fresh for each job, with `INSTALL_LOCK=true` and open registration. It has no administrator, no users, and no state carried from any earlier run. `ct.yml` already compensates for this with its "Register the owner and invited accounts" step, which signs six accounts up over the web form and mints three tokens over `POST /api/v1/users/{user}/tokens` using basic auth. The admin identity has to be produced the same way, in the same step, because there is nowhere else it could come from.

Gitea refuses `POST /admin/users` to a token without the `write:admin` scope, and refuses the scope's effect to a token whose owner is not an administrator. Both halves have to hold.

## Goals / Non-Goals

**Goals:**

- One administrative identity per job, produced by the job, usable by any of the three browser processes at once.
- The failure mode when the identity is not actually privileged is a named failure at provisioning time, not a `BeforeAll` stack trace four minutes in.
- `.env` on a developer machine keeps working unchanged: the suite reads one variable, and the workflow now sets the same one.

**Non-Goals:**

- Matching `.env`'s shape beyond `GITEA_ADMIN_TOKEN`. `design.md` of `2026-09-14-cucumber-seeded-users` mentions `GITEA_ADMIN_USERNAME` / `GITEA_ADMIN_PASSWORD` being added locally, but no code reads them: `resolveAdminToken()` reads the token alone. The workflow exports the token alone.
- Reusing the identity for anything other than the seeded-user create/delete calls.

## Decisions

**A dedicated `ct-admin` account, registered before the three owners, rather than reusing `chrome-owner`.**
Gitea makes the first user registered on a fresh instance an administrator. Today that is `chrome-owner`, by accident of loop order, so the cheapest fix would be to add `write:admin` to its existing token and export it twice. Rejected: it hands administrative privilege to the token that Vitest's and Cucumber's owner-driven scenarios use for ordinary repository and organization work, so an over-broad API call in a test would silently succeed instead of returning 403. Registering `ct-admin` first keeps the admin identity separate and makes the ordering deliberate rather than incidental. The owner loop is unchanged; one `register` call is added ahead of it.

**Alternative rejected: the image's `GITEA_ADMIN_USERNAME` / `GITEA_ADMIN_PASSWORD` entrypoint variables.** `docker.gitea.com/gitea` can create an administrator at first start from its setup script, which would remove the dependency on the first-user rule entirely. Not chosen because the interaction between that script and a pre-set `INSTALL_LOCK=true` is unverified, and `services:` containers give no way to read the container's logs when it silently does nothing. The first-user rule is observable from the API in the same step that depends on it.

**The step probes the token before exporting it.** After minting, it calls an administrator-only read (`GET /api/v1/admin/users`) with the new token. A 403 means the first-user rule did not apply the way this design assumes, and the job stops there with a message naming `ct-admin`. This turns the design's one unverified assumption into a loud, immediate failure instead of a confusing one, and it is the same shape as the existing "Check the healing store is answering" step, which already fails a job early rather than letting a suite run in a broken environment.

**Scopes stay minimal per identity.** `ct-admin`'s token gets `write:admin` only; it never drives a browser. The owner tokens keep `write:user,write:repository,write:issue,write:organization` exactly as they are.

## Risks / Trade-offs

- **[Risk]** Gitea changes or drops the "first registered user is an administrator" rule in a future image tag. → The probe fails the job at the provisioning step with a message naming the account, so the cause is visible in the step that caused it. `ct.yml` pins `gitea:1.27.3`, so this cannot arrive unannounced.
- **[Risk]** The registration step gains a fourth account and a fourth token, lengthening a step that already fails opaquely if any single `curl` fails. → `register()` already echoes a line per account and the step runs under `-e -o pipefail`; the new call follows the same pattern and echoes the same way.
- **[Trade-off]** One shared administrative token across three parallel browser processes. Accepted, and already reasoned in `2026-09-14-cucumber-seeded-users` design.md: `deleteSeededUsers()` only ever iterates the list its own process populated, so there is no cross-process list to over-delete from.
- **[Risk]** `GITEA_ADMIN_TOKEN` leaking into the Allure report or the run log. → `::add-mask::` is applied before the value is written to `$GITHUB_ENV`, the same order the existing owner-token loop uses.
