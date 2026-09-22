## Context

`playwright.config.ts` sets no `viewport` in its shared `use` block, so every project (functional and `visual-*`) renders at Playwright's default desktop viewport (1280x720). The visual suite's projects are derived per-browser (`visual-chrome`, `visual-firefox`, `visual-edge`), not per-viewport-size; adding a size dimension by duplicating that project list would double the projects the whole suite runs, including specs that don't care about mobile. See proposal.md for why only one spec needs the narrower viewport.

## Goals / Non-Goals

**Goals:**

- Render exactly one spec's pages at a phone width, without touching the viewport any other spec (functional or visual) runs at.
- Keep the change to test files only; no config or fixture edits.

**Non-Goals:**

- A reusable "mobile project" or `devices[...]` preset for future specs — out of scope per proposal.md, revisit if/when a second mobile spec is needed.
- Testing interaction (tap targets, touch events) at the phone width — this is a layout/screenshot check only.

## Decisions

**Scope the viewport with `test.use({ viewport })` at the top of a new, dedicated spec file**, rather than:

- _A new Playwright project (e.g. `visual-chrome-mobile`)_: would apply to every spec under `tests/non-functional/visual/`, not just this one, and doubles the projects the CI/local visual run executes for a single spec's sake. Rejected — proposal explicitly scopes this to one flow.
- _`page.setViewportSize()` inside the test body_: resizes the viewport after the page/context already exist for the test's configured (desktop) size, which is a mid-test resize rather than a phone-sized page load from the start, and Playwright's own guidance is to set `viewport` through `test.use`/fixtures instead. Rejected.
- _A `devices['iPhone 13']`-style preset_: bundles touch emulation, a mobile user agent and device scale factor, none of which this check needs (Non-Goals) and which would make the baseline harder to compare against the desktop one. Rejected in favor of a plain `{ width, height }` viewport override.

`test.use({ viewport })` placed at the top level of the new spec file applies only to tests declared in that file (Playwright scopes `test.use` to the file/describe block it's called in), so every existing spec's viewport is untouched — this directly satisfies the "Viewport override scoped to the spec that needs it" requirement.

**New file, not a new test in `main-view.spec.ts`**: `test.use` set inside a `test.describe` block only overrides fixtures for tests inside that block, but `main-view.spec.ts` declares its one test at the top level, not inside a describe. Adding a second, mobile-viewport test would need its own `test.describe` wrapper anyway; a separate file (`main-view-mobile.spec.ts`) keeps that scoping implicit and keeps the desktop spec untouched.

**Own baseline name** (e.g. `main-mobile.png`): the snapshot path template already keys baselines by `{projectName}/{platform}/{arg}`, so a same-named `main.png` from a different-viewport spec run on the same project/platform would silently overwrite or conflict with the desktop baseline. A distinct name avoids that regardless of directory layout.

**Viewport dimensions**: a common phone width/height (390x844, matching a current iPhone's CSS viewport) rather than an arbitrary number, so the check reflects a real device class.

## Risks / Trade-offs

- Only chrome's local baseline is recorded (per proposal's Out of Scope) → firefox/edge and CI (linux) baselines are missing until someone runs `test:visual:update` for those; the spec still runs, just without a baseline to compare against on first run (Playwright records a new baseline and passes, per its default `toHaveScreenshot` behavior).
- A hand-picked viewport size is arbitrary and could drift from real devices over time → acceptable for a first phone-width check; revisit if a specific breakpoint needs covering.
