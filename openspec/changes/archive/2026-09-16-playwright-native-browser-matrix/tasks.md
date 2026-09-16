## 1. Config

- [x] 1.1 Replace `chromium`/`firefox`/`webkit` in `playwright.config.ts`'s `projects` with `chrome` (`{ ...devices['Desktop Chrome'], channel: 'chrome' }`), `firefox` (unchanged device, renamed if needed) and `edge` (`{ ...devices['Desktop Edge'], channel: 'msedge' }`); verify `npx playwright test --list` shows exactly these three project names

## 2. Scripts

- [x] 2.1 Add `test:chrome`, `test:firefox`, `test:edge` to `services/playwright-native/package.json`, each `cross-env BROWSER=<name> playwright test --project=<name> --workers=1`; verify each runs standalone and passes the example spec on its one browser
- [x] 2.2 Add `test:parallel` running the three via `concurrently` (same `-n`/`-c` shape as the root `test:parallel` script); verify it runs all three as separate processes and all pass
- [x] 2.3 Leave `test` (`playwright test`) as-is; verify it still runs all three projects in one process

## 3. Documentation

- [x] 3.1 Update `services/playwright-native/README.md`'s "Running it" section to list `test`, `test:chrome`, `test:firefox`, `test:edge`, `test:parallel` and what each is for, noting `process.env.BROWSER` is set for a future Gitea test to read but nothing here consumes it yet

## 4. Verification

- [x] 4.1 Run `npm run format`, `npm run lint` and `npm run typecheck` from the repo root; verify all three succeed
- [x] 4.2 Run `npm run test:parallel -w @gitea-automation/playwright-native` and confirm three concurrent process logs (chrome/firefox/edge), each reporting its own passes, with no shared-worker interleaving inside a single browser's output — confirmed: each of `[chrome]`/`[firefox]`/`[edge]` logged "Running 2 tests using 1 worker" and "2 passed" independently
