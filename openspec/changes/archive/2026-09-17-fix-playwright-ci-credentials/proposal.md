## Why

The CT pipeline's `playwright` job failed on every browser: `login-api.spec.ts` and `login-ui.spec.ts` both threw `Missing API token for browser "CHROME"` / `Missing owner credentials for browser "CHROME"` — even in the firefox and edge runs. Two independent bugs, both hit at once because CI invokes the suite's plain `npm test` rather than `test:chrome`/`test:firefox`/`test:edge`.

## What Changes

- `services/playwright-native/fixtures/credentials.ts`: `resolveOwnerCredentials`/`resolveOwnerToken` now take the project name as a parameter instead of reading `process.env.BROWSER`. `npm test` (`playwright test`, no `--project`) runs all three projects in one worker process, so an env var can't vary per project within it — it was always `undefined`, falling back to `"chrome"` for every project regardless of which browser was actually running. The project name now comes from Playwright's own `testInfo.project.name`, passed to every fixture and test callback as its third argument.
- `.gitea/workflows/ct.yml`'s `playwright` job: added the same account-registration step the `selenium` job already has, scaled to what this suite needs (no invited users, no admin token — just `chrome-owner`/`firefox-owner`/`edge-owner` and their API tokens). The job previously only set `GITEA_BASE_URL`; it never registered any Gitea account against its own `gitea-test` instance, so the credentials `login-api.spec.ts`/`login-ui.spec.ts` need never existed there.
- `package-lock.json`: dropped a stale `@rolldown/binding-linux-x64-gnu` root dependency left over from an install on a different OS. Unrelated to the pipeline bug itself, but it was why this machine's `node_modules/.bin` had Unix-style symlinks instead of Windows `.cmd` shims, breaking `npm run lint`/`cross-env` locally while chasing this.

### Out of scope

- Any other stub `IInteractionStrategy` method, or further CI/report changes beyond the credentials gap.

## Capabilities

No requirement text changes — bug fixes only. `skip_specs: true`.

## Impact

Modified: `services/playwright-native/fixtures/credentials.ts`, `services/playwright-native/fixtures/fixture.ts`, `services/playwright-native/tests/login-api.spec.ts`, `services/playwright-native/tests/login-ui.spec.ts`, `.gitea/workflows/ct.yml`, `package-lock.json`.
