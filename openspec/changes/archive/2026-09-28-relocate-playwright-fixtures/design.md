## Context

The fixtures have to leave `core`, because a package at the bottom of the stack cannot depend on the layer above it. Where they go is the decision, and three placements were on the table.

## Why not `business-logic`

The cheapest move: `business-logic/playwright/fixtures/`. It is legal — the imports would run inward to `core` and outward to a library, never upward — and it needs no new package.

It was rejected because `business-logic` would then declare `@playwright/test`, and two of the four suites are Selenium. The package's defining property is that one page object runs under either tool; a manifest that names one of them costs that property for a reason unrelated to page objects. The fixtures are not domain code either: what forces an edit to them is a change in what the test wants set up, not a change in Gitea.

## Why not a fourth layer

`support/` beside `core`, `business-logic` and `services` reads as a new tier in the diagram, and the diagram is already the thing people get wrong about this repository. A fourth band would have to be explained every time the layer order is, and it would claim a rank the code does not have: nothing depends on this package except two suites.

Gradle's `java-test-fixtures` plugin is the precedent for the opposite reading. Test fixtures there are a second source set of the module that owns them, consumed as `testFixtures(project(':x'))` — a shared output inside an existing layer, not a layer of their own.

## The placement chosen

`services/_shared/playwright`, a package inside the test layer that is not a suite.

The leading underscore is the established mark for "not a peer of its siblings": Next.js opts `_`-prefixed folders out of routing, Jekyll does not process `_layouts`, Sass does not compile `_partial.scss` as an output. Here it says `services/*` are suites and `services/_shared` is not. It also sorts first.

The rule is refined rather than broken. It was "no service imports another service"; it becomes "no suite imports another suite, and a suite may import shared support, which is not a suite". That distinction is mechanical rather than a matter of naming: the support package declares no `test` script, which is already how `ct-functional.yml` decides what it runs.

## Risk checked first

Both `services/*` and `services/_shared/*` sit in the `workspaces` array, so the first glob also matches the `services/_shared` directory, which has no `package.json`. npm ignores it: `npm install` resolves all thirteen workspaces and reports nothing. Had it failed, the fallback was a flat `services/_shared-playwright`, which `services/*` matches without touching the root manifest.

One thing did break and is worth recording, because it fails quietly: the new `tsconfig.json` was copied from `core/playwright`, whose `extends` reaches two directories up. The new package is three deep, so the base config never applied, `strict` and `esModuleInterop` were off, and the damage surfaced as four `no-unnecessary-type-assertion` lint errors on `process.env.X!` — assertions that are only necessary under `strictNullChecks`. The lint errors were the symptom; the path was the cause.
