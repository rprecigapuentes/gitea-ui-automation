## Why

`npm run test:visual` merges only one browser's results (observed: only firefox) instead of all three. Playwright's blob reporter always clears its whole output directory on start unless told otherwise; `scripts/visual.mjs` points all three parallel browser processes at the same default `blob-report/` directory, so whichever process starts last wipes out the zip files the faster ones already wrote. The script also sets `PLAYWRIGHT_BLOB_OUTPUT_FILE_NAME`, which is not an env var this Playwright version reads (the real ones are `PLAYWRIGHT_BLOB_OUTPUT_DIR`/`PLAYWRIGHT_BLOB_OUTPUT_FILE`/`PLAYWRIGHT_BLOB_OUTPUT_NAME`), so it was silently a no-op.

## What Changes

- Point each browser's blob reporter at its own private directory (`PLAYWRIGHT_BLOB_OUTPUT_DIR`), so no process's startup cleanup can remove another's output.
- After all three finish, copy each browser's zip into one shared directory under a disambiguated name, then merge that directory as before.
- No behavior beyond "one merged report covering all three browsers" is added or changed — this restores what `test:visual` was already meant to do (per `openspec/changes/playwright-visual-testing/proposal.md`), so no capability's requirements change.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — this fixes a defect in `test:visual`'s already-intended behavior; no spec describes different behavior)

## Impact

- `services/playwright-native/scripts/visual.mjs` only.

## Out of Scope

- `test:visual:ci`, `test:visual:chrome/firefox/edge` and the other single-project scripts: they already write to the default directory without a sibling process racing them, so they are unaffected.
- Any change to what a merged report contains beyond fixing which browsers appear in it.
