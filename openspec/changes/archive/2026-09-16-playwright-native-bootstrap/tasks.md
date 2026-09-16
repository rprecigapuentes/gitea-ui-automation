## 1. Scaffold

- [x] 1.1 Run the Playwright installer (`npm init playwright@latest`) inside `services/playwright-native`, accepting TypeScript and the default `tests/` layout; verify it adds `@playwright/test` to the workspace's `package.json` and creates `playwright.config.ts` and `tests/example.spec.ts`
- [x] 1.2 Install the browser binaries (`npx playwright install`); verify `npx playwright test` reports the browsers as available rather than missing

## 2. Wire up the workspace

- [x] 2.1 Add a `test` script to `services/playwright-native/package.json` (`playwright test`) matching the `npm test -w <package>` convention the other services use; verify `npm test -w @gitea-automation/playwright-native` from the repo root runs and passes the example spec
- [x] 2.2 Confirm `services/playwright-native/tsconfig.json` (if the installer creates one) extends the repo's `tsconfig.base.json` the way other packages do, or remove it if Playwright's own config covers type-checking; verify `npm run typecheck --workspaces --if-present` from the repo root still succeeds

## 3. Documentation

- [x] 3.1 Update `services/playwright-native/README.md` to describe the workspace as scaffolded and runnable (dependency, config and example test in place) while keeping the "no Gitea-specific code yet" framing and the note that `core-playwright`/`business-logic-playwright` stay reserved; verify the README no longer says the workspace only holds a `package.json`

## 4. Verification

- [x] 4.1 Run `npm run format`, `npm run lint` and `npm run typecheck` from the repo root; verify all three succeed for the files this change touches — `format` and `typecheck` are fully clean; `lint` is clean for `services/playwright-native/**` (the two Playwright files that failed the project-service check before the added `tsconfig.json` now pass) but the overall command still exits 1 on 84 pre-existing errors under `tools/healenium-report-stats/.venv/**`, an untracked Python virtualenv being linted as JS — unrelated to this change and present before it
- [x] 4.2 Run `npm test -w @gitea-automation/playwright-native` once more; reproducible — 6 passed (4.9s), same as the first run
