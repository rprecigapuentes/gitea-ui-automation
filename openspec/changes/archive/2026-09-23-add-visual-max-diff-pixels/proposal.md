## Why

`VisualTester.verifyPage`/`verifyComponent` only accept `mask`. Several visual specs mask everything they can (the footer) yet still see small pixel diffs from font/anti-aliasing rendering noise unrelated to a real regression. `playwright-visual-testing`'s proposal already scoped this out on purpose ("Arguments beyond the page or locator and the baseline name... added one at a time as a test needs them") — a spec now needs a pixel tolerance.

## What Changes

- Add an optional `maxDiffPixels` to `VisualOptions`, forwarded to Playwright's own `toHaveScreenshot` option of the same name, for both `verifyPage` and `verifyComponent`.
- No default tolerance is set: omitting it keeps today's exact-match behavior for every existing call site.

## Capabilities

### New Capabilities

- `visual-testing`: not yet synced into `openspec/specs` (still pending in the sibling in-progress change `playwright-visual-testing`). This change adds the requirement that a visual check can allow a bounded number of differing pixels instead of requiring an exact match.

## Impact

- `core/playwright/visual-tester/visual-tester.ts` only. No caller is required to change; existing calls keep their current (zero-tolerance) behavior.

## Out of Scope

- A default or suite-wide tolerance: each spec opts in explicitly.
- Other `toHaveScreenshot` options (thresholds by ratio, animations, timeouts): added the same way, one at a time, when a spec needs one.
