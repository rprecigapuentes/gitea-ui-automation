## Why

`playwright-native`'s scaffolded config lets Playwright's own scheduler spread every test×project combination across shared workers (`fullyParallel: true`, unbounded `workers`) — the run that produced "6 workers" for 2 tests × 3 browsers. The Selenium services in this monorepo deliberately avoid that: each browser is its own OS process, so that Gitea test users can be assigned per browser without two browsers racing to log in as the same account. `playwright-native` should follow the same convention before any Gitea-specific test is written on top of it, so that test doesn't have to be retrofitted for process isolation later.

## What Changes

- **BREAKING** (workspace-local): `playwright.config.ts`'s `projects` become `chrome` (real Chrome via `channel: 'chrome'`), `firefox`, and `edge` (`channel: 'msedge'`) — replacing the scaffolded `chromium`/`firefox`/`webkit` trio, matching the browser matrix `gitea-selenium-vitest`/`gitea-selenium-cucumber` already run.
- Add `test:chrome`, `test:firefox`, `test:edge` scripts, each running `playwright test --project=<name> --workers=1` with `BROWSER=<name>` set (via `cross-env`, already a root devDependency), and a `test:parallel` script running the three together via `concurrently` — the same shape as the root `test:parallel`/`test:cucumber:parallel` scripts.
- The base `test` script (`playwright test`) stays as the simple "run everything" entry point; nothing here removes it.
- `services/playwright-native/README.md` documents the new scripts.

### Out of scope

- Resolving or using real Gitea credentials per browser. `session-credentials.util.ts` in `gitea-selenium-vitest` reads `process.env.BROWSER` to pick a suffix (`GITEA_OWNER_CHROME`, etc.) — this change only makes `process.env.BROWSER` available to a future Playwright test the same way; it adds no credential-resolution code, because there is no Gitea test or `business-logic-playwright` client yet to consume it.
- Any Gitea-specific test, page object, or API client.
- The example test's content (`tests/example.spec.ts` keeps testing playwright.dev — still the stock example).
- CI wiring (`.gitea/workflows/ct.yml`).

## Capabilities

No spec-level behavior changes: this reconfigures how an already-reserved, example-only workspace schedules its own example test across browsers. No requirement of the automation framework (as `openspec/specs/` describes it) changes. `.openspec.yaml` sets `skip_specs: true`.

## Impact

`services/playwright-native/playwright.config.ts`, `services/playwright-native/package.json`, `services/playwright-native/README.md`, root `package-lock.json` (no new dependency expected — `cross-env` and `concurrently` are already root devDependencies). No change to `core/`, `business-logic/`, or `.gitea/workflows/`.
