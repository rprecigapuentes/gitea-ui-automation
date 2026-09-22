## Why

`.gitea/workflows/visual.yml` currently runs as two jobs (`baselines` then `visual`), added by `playwright-visual-testing`'s tasks 12.1/12.2: the first job records whatever baselines the runner lacks and, if it recorded anything, hands them to the second job to compare against. This was meant to save the manual step of downloading and committing baselines. The person running the pipeline wants that manual step back: the workflow should go back to its original single-job shape from task 9.3, where it just runs the suite once and uploads whatever it produced (report and/or recorded baselines) for a person to review and commit by hand.

## What Changes

- Collapse `.gitea/workflows/visual.yml` back to one job: run the suite once (comparing by default, or recording every baseline when `record_baselines` is set or the commit message carries `[record-baselines]`), then upload both the native Playwright report and the recorded baselines (when any exist) with `if: always()`.
- Remove the "detect what was recorded" fingerprinting step and the second `visual` job entirely — there is no automatic follow-up comparison run.
- This supersedes tasks 12.1 and 12.2 of `openspec/changes/playwright-visual-testing`, which are not un-marked here (that change is left as a historical record of what was tried) but no longer reflect the workflow's actual shape.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — the two-job flow this reverts was never synced into `openspec/specs/pipeline`, so no archived requirement describes it)

## Impact

- `.gitea/workflows/visual.yml` only.

## Out of Scope

- Changing `test:visual:ci`, `test:visual:ci:missing` or `test:visual:ci:update` themselves.
- Any change to how baselines are recorded locally (`npm run test:visual:update`).
