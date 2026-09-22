## Why

The visual suite (`playwright-visual-testing`) only ever renders pages at each browser's default desktop viewport, so nothing in the framework catches a layout that breaks or fails to adapt at a phone width. The main-view smoke already proves the visual-check pattern (sign in, assert the page loaded, compare a screenshot); the suite needs a phone-width variant of that same flow to close this gap.

## What Changes

- Add a phone-width visual smoke under `tests/non-functional/visual/authentication/`, reusing the main-view smoke's flow (sign in as the owner, assert the main view loaded, compare a screenshot) but rendered at a phone viewport width instead of the project's desktop default.
- Scope the phone viewport to only this spec via Playwright's per-file/per-describe `test.use({ viewport })`, so the existing desktop visual and functional projects keep their current viewport unchanged — no new Playwright project or config-wide viewport change is needed.
- Record a screenshot baseline under its own name (distinct from `main.png`) so it cannot collide with the desktop baseline in the same `{projectName}/{platform}` folder.
- Run the phone-width spec on all three `visual-*` projects (chrome, firefox, edge), the same as every other spec under `tests/non-functional/visual/`, with a baseline recorded per project.

## Capabilities

### New Capabilities

- `visual-testing`: not yet synced into `openspec/specs` (still pending in the sibling in-progress change `playwright-visual-testing`, which introduces `VisualTester`, the `visual-*` projects and the main-view smoke this change extends). This change adds the requirement that the suite can check a page at a narrower, phone-sized viewport in addition to each browser's default desktop viewport, and that the viewport override is scoped to the spec that needs it.

## Impact

- `services/playwright-native/tests/non-functional/visual/authentication/` (new spec), `services/playwright-native/tests/non-functional/visual/baselines/` (new baseline image(s)).
- No change to `playwright.config.ts` projects, `fixtures/visual.fixture.ts`, or `core/playwright/visual-tester/visual-tester.ts` — the viewport is set per-spec via `test.use`, not per-project.

## Out of Scope

- A dedicated mobile Playwright project or a mobile `devices[...]` preset (touch emulation, mobile user agent): only the viewport width/height changes.
- Mobile viewports for any other existing visual or functional spec (organizations, issues, project-board): only the main-view flow gets a mobile variant.
- Running the mobile spec in CI or committing runner (linux) baselines: local win32 baselines only, same as a freshly added spec before `playwright-visual-testing`'s task 9.4 runs.
- Any change to `main-view.spec.ts` itself or its desktop baseline.
