## Why

Issue #108 asks for the accessibility, visual and performance suites to run on the continuous-testing pipeline, one job each, publishing their evidence and gating nothing. Today each runs from a workflow of its own, dispatched by hand, and `ct.yml` carries the functional suites alone. Five workflows for two kinds of run is more to explain than to operate, and a suite nobody dispatches produces no evidence at all.

## What Changes

- `ct.yml` becomes `CT-functional`: the vitest, Cucumber and Playwright functional suites, on the schedule it already keeps.
- A new `CT-non-functional` workflow carries one job per non-functional suite, each provisioning its own application under test and publishing the artifact it publishes today under the same name.
- `accessibility.yml`, `visual.yml` and `performance.yml` are removed, their jobs having moved.
- Neither workflow gates a merge: `ci.yml` stays the only check in the path of a change.
- Both READMEs describe the two workflows and what each publishes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pipeline`: `The visual suite runs on its own manually dispatched workflow` becomes a requirement that a non-functional suite runs as its own job on a workflow reserved for non-functional suites, still unreachable from the functional suites' run and still gating nothing. The constraint that survives is the isolation, not the one-workflow-per-suite shape.

## Impact

`.gitea/workflows/` (four files removed or renamed, one added), `README.md`, `services/playwright-native/README.md`. No test, fixture or page-object changes: every job runs the same script it runs today.

## Out of Scope

- What each suite publishes. The artifacts are the ones `add-pipeline-failure-artifacts` settles; this change only moves where they are produced.
- The schedule of the non-functional workflow, and whether it has one at all, which is decided when the jobs are in place and their duration is known.
- Making any suite gate a merge.
- The execution trend, which reads the artifacts rather than producing them.
