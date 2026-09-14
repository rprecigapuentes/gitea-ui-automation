## 1. Add an isolated repo-to-team assignment smoke

- [x] 1.1 Add `TeamClient.createTeam()`. Add `"a team named {string} already exists"` and `"a repository named {string} already exists"` Given steps. Add an `@smoke` scenario that assigns an existing repo to an existing team, reusing the e2e's `When`/`Then` steps. Verified: root `typecheck` clean, `eslint` clean, `--tags "@smoke"` (5 scenarios, 26 steps passed), `--tags "@e2e"` (15 steps passed, no regressions).
