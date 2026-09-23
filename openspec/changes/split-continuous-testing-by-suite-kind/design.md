## Context

See proposal.md - Why. Five workflows exist today: `ci.yml` gates merges, `ct.yml` carries the functional suites on a daily cron, and `accessibility.yml`, `visual.yml` and `performance.yml` each carry one non-functional suite on manual dispatch. Issue #108 asks for one job per non-functional suite on the continuous-testing pipeline.

## Goals / Non-Goals

**Goals:**

- One job per non-functional suite, each publishing its evidence, gating nothing.
- A measurement never taken beside other work on the same runner.

**Non-Goals:**

- Changing what any suite runs or publishes. Every job runs the script it runs today.
- Deciding the non-functional workflow's schedule, which needs the jobs' real duration first.
- Making any suite a merge gate.

## Decisions

- **Two workflows, not one.** The issue's wording is "one job per non-functional suite in `.gitea/workflows/ct.yml`". Two workflows deliver what that asks for while keeping the isolation the existing `pipeline` spec required: a `CT-functional` run is not lengthened by the scans, and a red scan is not read as a red functional run. The alternative, one file with six jobs, was rejected because the dispatch input that selects a suite would have to grow to cover both kinds, and because the two are read by different people for different reasons. Raised with the issue's author before merging.
- **The jobs are chained with `needs`, not run in parallel.** `ct.yml` already does this between its `selenium` and `playwright` jobs, for the same reason: one VPS, one application under test at a time. The `performance` job makes it a correctness requirement rather than a preference, because a browser running beside it is reported as the page's own cost. `always()` on each `needs` keeps one job's failure from cancelling the rest, which is the behaviour `ct.yml` already documents.
- **Both workflows share one concurrency group, and it no longer cancels in progress.** Separate groups would let a dispatched `CT-non-functional` run beside the daily `CT-functional`, which is exactly the overlap the performance job cannot have. `cancel-in-progress: false` was chosen over `true` so the queued run is delayed rather than dropped: these workflows gate nothing, so waiting costs nothing, and a cancelled run is a missing point on the execution trend.
- **`performance` is the last job in the chain.** Being last, it is also the only one still running when it runs, which is the cheapest way to give it the isolation it needs without a second concurrency group.

## Risks / Trade-offs

- [A dispatched non-functional run now waits for a functional run to finish, where before it started immediately] → Mitigation: accepted. Neither gates a merge, and the alternative is a measurement that cannot be trusted.
- [The chained jobs make the non-functional workflow as long as the three suites put together] → Mitigation: none applied. The duration is what decides whether it gets a cron at all, which is deliberately left to a follow-up.
- [`playwright-accessibility-scans`, still unarchived, carries the requirement "A suite that produces evidence runs on its own manually dispatched workflow", which this change contradicts] → Mitigation: flagged rather than edited. That change's delta is its own record and is not rewritten here; when it archives, its requirement has to be reconciled against the two added by this change, and the person archiving it decides which wins.
