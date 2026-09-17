## Context

See proposal.md - Why. Two existing facts shape this:

`gitea-selenium-vitest`'s `vitest.config.ts` defines one project per browser (`chrome`, `firefox`, `edge`) with `fileParallelism: false`, and the root `test:chrome`/`test:firefox`/`test:edge`/`test:parallel` scripts run those as separate `vitest run --project=<name>` invocations, `concurrently`-wrapped for the parallel case. `session-credentials.util.ts` picks a Gitea user by reading `process.env.BROWSER` and looking up `GITEA_OWNER_<BROWSER>` — the process boundary is what makes two browsers safe to run at once without contending for the same account.

Playwright's own `projects` array is not a process boundary: `fullyParallel` schedules every test file against every project on whatever workers are available in one process, which is why the scaffolded config produced "6 workers" for 2 tests × 3 browsers instead of one lane per browser.

## Goals / Non-Goals

**Goals:**

- Running `test:chrome`, `test:firefox` and `test:edge` each starts its own `playwright test` process scoped to one project, so a future Gitea test can read `process.env.BROWSER` the same way the Vitest suite's fixtures already do.
- `test:parallel` runs the three as concurrent OS processes, mirroring the root README's description of why the Vitest suite does this ("a stronger guarantee of real 3-way parallelism than relying on a single process to schedule everything internally").
- The plain `test` script keeps working as a one-command way to run everything, for whoever just wants to see it pass.

**Non-Goals:**

- Wiring `process.env.BROWSER` to an actual credential lookup. That lookup only makes sense once a Playwright client/page layer exists to consume it (`core-playwright`/`business-logic-playwright`), which is still reserved.
- Matching Vitest's BrowserStack projects or Allure reporting. Out of scope per proposal.md.
- Changing `tests/example.spec.ts` itself — it keeps exercising playwright.dev, unmodified.

## Decisions

**Projects are named `chrome`/`firefox`/`edge`, not `chromium`/`firefox`/`webkit`.** The Selenium services' browser matrix is chrome/firefox/edge; keeping Playwright's scaffolded names would leave two different vocabularies for "the same three browsers" in one monorepo. `chrome` and `edge` use `channel: 'chrome'` / `channel: 'msedge'` so they drive the actual installed browsers (Playwright's default `chromium`/`webkit` projects run Playwright's bundled Chromium/WebKit builds instead, which is what the scaffold gives you before this change).

**Per-browser scripts set `--workers=1` explicitly rather than relying on config alone.** `workers: 1` in `playwright.config.ts` would also cap the plain `test` script and defeat its "just run everything, fast" purpose. Scoping the limit to the `--project` invocations keeps the two use cases (fast local run vs. process-isolated per-browser run) independent, the same way Vitest's `fileParallelism: false` lives on the per-browser `projects` entries and not on the top-level config.

**`BROWSER` is set via `cross-env`, not read some other way.** Matches the Vitest scripts' own `cross-env BROWSER=chrome vitest run --project=chrome` pattern exactly, so a reader who already knows that convention recognizes it here.

**No dependency is added.** `cross-env` and `concurrently` are `gitea-selenium-vitest` devDependencies but hoist to the workspace root's `node_modules/.bin` (confirmed: no per-package nesting), so `playwright-native`'s own scripts can call them without declaring them.

## Risks / Trade-offs

- **`channel: 'chrome'`/`'msedge'` require the real browsers installed on the machine, not just Playwright's downloaded binaries**, unlike the scaffolded `chromium`/`webkit` projects. → Same requirement the Selenium services already have (real Chrome/Edge via WebDriver); CI images that run those already carry the browsers.
- **Dropping `webkit` loses Safari-engine coverage the scaffold gave for free.** → Not a regression in practice: nothing in this monorepo has ever run a WebKit/Safari check, and the goal here is parity with the browsers this project actually tests against.
