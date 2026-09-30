## Why

API coverage is measured: the specification declares what exists, the tests that touch it are
counted, and the ratio is reported per level. A UI has no such document, so nothing measures how
much of it the automation exercises. Counting what the tests touch is mechanical; what is missing is
the inventory of what exists.

## What Changes

- `services/playwright-bdd/scripts/ui-coverage/`, small Node scripts in the suite it measures, one per
  stage: crawl, parse, match, report.
- The denominator is the crawled application: URLs reached, interactive elements per URL and the
  states observed per element and actions each one allows, read from the page. It is committed as
  `services/playwright-bdd/coverage-data/inventory/ui-inventory.json`, sorted and free of ids and timestamps, so two runs
  can be compared with a diff.
- The numerator is the page objects that the `playwright-bdd` steps reach, parsed statically with the
  TypeScript compiler API. No model is involved, and no page object is modified.
- A figure per level, mirroring the API method: URLs, then elements, then states, then actions.
- The limits of the measurement, and why the figure is a floor, are written in `design.md`.

## Capabilities

### New Capabilities

- `ui-coverage`: the framework measures how much of the crawled UI its `playwright-bdd` suite
  exercises.

## Impact

- New: `services/playwright-bdd/scripts/ui-coverage/`, `services/playwright-bdd/coverage-data/`.
  Modified: `services/playwright-bdd/package.json`, `.gitea/workflows/ct-functional.yml`.
- `openspec/specs/` is not the denominator. Those specs describe the automation framework and never
  Gitea's behaviour, so counting against them would measure the framework against itself.

Out of scope: the Selenium and `playwright-native` suites, changing any page object or step, and
claiming that running the suite more often improves coverage. This measures a dimension that is not
measured today; it does not move the number by itself.
