## Why

`core/playwright/fixtures/` imports `business-logic` in 19 places across five files, and `core/playwright/package.json` declares `@gitea-automation/business-logic` as a dependency. The layer order is tests on top, business logic in the middle, core at the bottom, so a `core/` package that depends on `business-logic` points its dependency at the layer above it. It also falsifies the repository's own claim that `core` imports zero files from `business-logic`, true when it was verified by import scan and false since the fixtures landed there.

The fixtures are test-layer code. They are the composition root — they decide which concrete strategy is injected — and they are setup and teardown. The Selenium equivalent, `features/support/hooks.ts`, already lives in its service for that reason. The Playwright one went to `core` only because two suites share it and no service may import another: to keep the horizontal rule, the vertical one was broken.

## What Changes

- Add `services/_shared/playwright` (`@gitea-automation/shared-playwright`), a member of the test layer that is not a suite: it declares no `test` script, which is how `ct-functional.yml` already separates what runs from what is depended on. The root `workspaces` array gains `services/_shared/*`.
- Move the six files of `core/playwright/fixtures/` into it unchanged. Their relative imports do not move.
- `playwright-bdd` and `playwright-native` import from the new package. `playwright-bdd` drops `core-playwright`, which it used for nothing else; `playwright-native` keeps it for `VisualTester` and `PerformanceCollector`.
- `core/playwright/package.json` is left declaring one dependency, `@playwright/test`. That is the check that the move worked.

### Out of scope

- Any behavioral change. The fixtures move unedited.
- `visual-tester/` and `performance-collector/`, which import only `@playwright/test` and are legitimate `core`.
- Moving Cucumber's `hooks.ts`. It has one consumer, so there is nothing to share.
- Moving `IInteractionStrategy` to `business-logic`. Under the layered model it is fine where it is.
- The domain rule inside `base.fixtures.ts` about deleting an organization that still owns repositories.

## Capabilities

No requirement text changes — a relocation with no behavior change. `skip_specs: true`.

## Impact

New: `services/_shared/playwright/` (`package.json`, `tsconfig.json`, `README.md`, and the six relocated modules). Removed: `core/playwright/fixtures/`. Modified: root `package.json` and `README.md`, `core/playwright/package.json` and `README.md`, both Playwright services' manifests, their 12 importing files, and `services/playwright-bdd/README.md`.
