## 1. Add an isolated repo-to-team assignment smoke

- [x] 1.1 Add `TeamClient.createTeam()`. Add a `@team-repository`-tagged `Before` hook that seeds an org, team and repo via API. Add `"the seeded organization is open"` step and an `@smoke` scenario that assigns the seeded repo to the seeded team, reusing the e2e's `When`/`Then` steps. Verified: root `typecheck` clean, `eslint` clean, `--tags "@smoke"` (5 scenarios, 24 steps passed), `--tags "@e2e"` (15 steps passed, no regressions).
