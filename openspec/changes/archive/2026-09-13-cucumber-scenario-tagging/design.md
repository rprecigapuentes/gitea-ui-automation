## Context

See proposal.md - Why. Current state: `hooks.ts` has `Before`/`After({ tags: "@project-board" })` (seeds org+2 repos+issues, deletes repos then org) and `After({ tags: "@organizations" })` (deletes org only) — the latter's body is a near-verbatim copy of the former's org-deletion lines. `cucumber.mjs` has no `tags` field; no npm script passes `--tags`, though `cucumber-js` already accepts it natively (already relied on by `cucumber-project-board-smokes`'s own task 3.2 verification step, `npm run test:cucumber -- --tags @project-board`).

## Goals / Non-Goals

**Goals:**

- One shared piece of code answers "delete this organization, and don't let a failure here escape" for every tagged hook that needs it.
- Running a subset of scenarios by tag needs no more than a named `npm run` script per tag, including its 3-browser form.
- `npm run typecheck` is green again across every workspace.

**Non-Goals:**

- A general-purpose tag-to-hook registration system. Two tags exist today; a helper function and two short `npm run` script pairs are enough. Revisit if the number of tags grows enough that per-tag script pairs become unwieldy.
- Anything about `cucumber-project-board-smokes`'s own remaining tasks.

## Decisions

**Extract a `deleteSeededOrganization(name, organizations)` helper, called by both `After` hooks.** Alternative considered: leave the duplication, since it's only ~6 lines. Rejected — it's the literal reason task well duplicated logic drifts (one copy gets a fix or a log-message tweak the other doesn't), and the whole point of this change is to stop copy-pasting hook bodies (see the `@project-board`/`@organizations` tag duplication this change also fixes).

**Give `@project-board`'s repository-deletion loop its own `try/catch`, separate from the org-deletion call.** Today both are inside one `try`, so a repository-deletion failure skips the org-deletion attempt entirely (the `catch` swallows everything after the throw). Splitting them means the org-deletion is always attempted once repository deletion has run (or failed), which is the more defensive posture. It's a slightly bigger blast radius than the proposal strictly asked for, but it's the same file, the same pattern, and leaving it inconsistent (one hook defensive, the sibling hook not) would read as an oversight.

**`CUCUMBER_TAGS` env var into `cucumber.mjs`'s `tags` field, not per-tag npm scripts duplicating the whole browser matrix.** Considered: a `test:organizations:chrome`/`:firefox`/`:edge`/`:parallel` set per tag, matching today's `test:chrome`/`:firefox`/`:edge`/`:parallel` exactly. Rejected per the user's own steer — `concurrently`'s children inherit the parent process's env, so one `cross-env CUCUMBER_TAGS=... npm run test:parallel` script gets the 3-browser fan-out for free; a duplicated matrix would be 4 scripts per tag instead of 1, for the same result.

**`fixture.ts` fix is a one-line constructor-arity change, not a design decision** — `OrganizationDashboardPage`'s own shape (one constructor arg + `waitForElements(organization)`) was already decided outside this change; this just makes the caller match it.

## Risks / Trade-offs

- **[Risk]** A future third tag means a third `test:<tag>`/`test:<tag>:parallel` pair by hand. → **Mitigation**: cheap enough at this scale (proposal's Non-Goals); revisit only if it becomes a pattern of its own.
- **[Risk]** `deleteSeededOrganization` swallows its own errors (by design, so cleanup failure never masks the scenario's result), so a silently-failing delete is only visible in logs. → **Mitigation**: unchanged from today's existing behavior for `@project-board`; this change doesn't make that worse, just shares it.
- **[Risk]** Splitting `@project-board`'s repository-deletion try/catch from the org-deletion attempt means Gitea's org-deletion call now always fires even when repositories are known to still exist (it will fail server-side and get caught/logged rather than being skipped client-side). → **Mitigation**: that failure is caught and logged the same way; the org is left for a human to clean up either way, but now the log names the org-deletion failure specifically rather than only the repository one.

## Migration Plan

Implemented directly on `rene/83-add-org-e2e-test`, task by task — see tasks.md. Each task is reviewed and committed by the user individually (not this agent). Rollback is `git revert` per commit; no data or environment migration involved.
