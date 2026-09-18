## 1. Fix credential resolution

- [x] 1.1 Diagnosed from the CI log: all three browser projects (chrome, firefox, edge) reported "CHROME" in their error, meaning `process.env.BROWSER` was never set — `npm test` runs `playwright test` with no `--project`, all three projects in one worker process, unlike `test:chrome`/`test:firefox`/`test:edge`'s separate `cross-env BROWSER=x` processes
- [x] 1.2 `credentials.ts`: `resolveOwnerCredentials`/`resolveOwnerToken` take a `project: string` parameter instead of reading an env var
- [x] 1.3 `fixture.ts`'s `clients`/`sessionManager` fixtures and both `login-api.spec.ts`/`login-ui.spec.ts` pass `testInfo.project.name` (Playwright's own per-test/per-fixture third argument)
- [x] 1.4 Verified `npm run typecheck -w @gitea-automation/playwright-native` and `npm run lint` green

## 2. Fix the CI job's missing accounts

- [x] 2.1 Added a "Register the browser accounts and mint their API tokens" step to the `playwright` job in `.gitea/workflows/ct.yml`, mirroring the `selenium` job's script scaled down to 3 owner accounts + tokens (no invited users, no admin) — a throwaway account registers first so none of the three browser owners becomes the instance's administrator by accident
- [x] 2.2 Validated the workflow YAML parses correctly

## 3. Verify

- [x] 3.1 Ran all three projects in one worker process locally (`playwright test`, no `--project` — the exact invocation `npm test`/CI uses) — 12/12 passed, reproducing and fixing the failure locally
- [x] 3.2 Ran `test:chrome`/`test:firefox`/`test:edge` individually — 4/4 each
- [x] 3.3 Found and cleaned up a stale `@rolldown/binding-linux-x64-gnu` lockfile entry (from a prior install on a different OS) that had left this machine's `node_modules/.bin` without proper Windows `.cmd` shims for `eslint`/`cross-env`; `npm install` regenerated them correctly
- [x] 3.4 Archive this change and commit

## 4. Follow-up: the registration step itself failed on the real pipeline

- [x] 4.1 Actually running it hit `/var/run/act/workflow/5.sh: 24: Bad substitution` — `${!owner_user}` is bash's indirect variable expansion, which `sh`/`dash` doesn't support. The `selenium` job's identical script works because it runs directly on the runner (bash by default); the `playwright` job runs inside a `container:`, where the runner defaults container steps to `sh`. Fixed by setting `shell: bash` on just this one step, rather than rewriting the script to avoid indirection and diverge from the selenium job's established pattern
- [x] 4.2 Validated the workflow YAML still parses and the step's `shell` field is set
