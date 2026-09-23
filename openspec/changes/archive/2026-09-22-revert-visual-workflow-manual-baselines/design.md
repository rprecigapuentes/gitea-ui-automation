## Context

See proposal.md - Why. `toHaveScreenshot` auto-writes a missing baseline and reports that check as passed; the workflow's own exit code alone therefore cannot tell "a baseline was missing" apart from "everything genuinely matched."

## Goals / Non-Goals

**Goals:**

- Make a missing-baseline run visibly fail, without a second job and without changing what a normal comparison run reports for a real mismatch.

**Non-Goals:**

- Detecting _which_ pixels changed on a real mismatch: the native Playwright report already carries the expected/actual/diff images for that.
- Any change to local (non-CI) baseline recording.

## Decisions

**Detect a missing baseline by fingerprinting the baseline directory before and after the run** (`sha256sum` of every `.png`, diffed with `comm -13` after both listings are sorted), rather than:

- _Parsing the suite's stdout for "doesn't exist, writing actual"_: ties the check to Playwright's console wording, which is not a stable contract across versions. Rejected.
- _A dry `--list`/pre-check step that inspects the baselines folder against the spec list_: would need to reproduce Playwright's own snapshot-naming logic (per-project, per-platform paths) outside the suite. The fingerprint diff instead asks Playwright to do the one thing it's already doing (write the file) and observes the filesystem effect, which is simpler and can't drift out of sync with how naming actually works.

`comm -13` is safe here because in compare mode (`test:visual:ci`, no `--update-snapshots`) Playwright never rewrites an _existing_ baseline — a changed line always means a new path, never a same-path content change. That stops holding in record mode, where every baseline is rewritten, but record mode never fails on this diff anyway.

**Defer the suite's own exit code with `set +e` and evaluate it in a later step**, same as the pre-revert two-job design used: the "did a baseline get created" check needs to run after the suite regardless of whether the suite itself passed or failed, and a step that exits non-zero stops the job before the next step runs.

**Fail with `exit 1` from a dedicated step, not by making the suite command itself fail**: keeps the "why" (missing baseline vs. real mismatch vs. both) legible as separate log sections, and keeps the upload steps (`if: always()`) running regardless of which one is fail.

## Risks / Trade-offs

- A record run's fingerprint diff is not used to gate anything (see Decisions), so a corrupted or partial record run still reports success if the suite itself exits 0 — acceptable, since recording is manual-review-by-design (task 9.4/1.3's whole point is a person looks at the artifact before committing).
