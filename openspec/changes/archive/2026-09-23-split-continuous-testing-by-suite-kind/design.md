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

- **Two workflows, not one.** The issue's wording is "one job per non-functional suite in `.gitea/workflows/ct.yml`". Two workflows deliver what that asks for while keeping the isolation the existing `pipeline` spec required: a `CT-functional` run is not lengthened by the scans, and a red scan is not read as a red functional run. The alternative, one file with six jobs, was rejected because the dispatch input that selects a suite would have to grow to cover both kinds, and because the two are read by different people for different reasons. The issue's Definition of Done is met by the two files together: one job per non-functional suite, each publishing its artifact, none of them gating a merge, and both READMEs describing them. This was settled before the work started, so the PR states it rather than asking for it.
- **The jobs are chained with `needs`, not run in parallel.** `ct.yml` already does this between its `selenium` and `playwright` jobs, for the same reason: one VPS, one application under test at a time. The `performance` job makes it a correctness requirement rather than a preference, because a browser running beside it is reported as the page's own cost. `always()` on each `needs` keeps one job's failure from cancelling the rest, which is the behaviour `ct.yml` already documents.
- **Each workflow keeps a concurrency group of its own.** Sharing one, with `cancel-in-progress: false`, was tried first: it reads as "the second run waits for the first", which would have stopped a dispatched `CT-non-functional` from measuring beside the daily `CT-functional`. Run #506 showed Gitea does not hold the second run, it cancels it, and the functional run was lost. A lost functional run is a missing point on the execution trend, which costs more than the overlap it was guarding against, so the groups are separate and the overlap is handled by not dispatching the non-functional workflow during the 11:00 cron. The chaining below still keeps the three non-functional jobs off each other.
- **`performance` is the last job in the chain.** Being last, it is also the only one still running when it runs, which is the cheapest way to give it the isolation it needs without a second concurrency group.

## Risks / Trade-offs

- [Nothing in the configuration stops a dispatched `CT-non-functional` from running beside the `CT-functional` cron, which would charge the measured page for the functional suite's work] → Mitigation: the note on the concurrency group says to dispatch away from 11:00. A configuration that enforced it would have to hold a run rather than cancel it, which this Gitea does not do.
- [The chained jobs make the non-functional workflow as long as the three suites put together] → Mitigation: none applied. The duration is what decides whether it gets a cron at all, which is deliberately left to a follow-up.
- [`playwright-accessibility-scans`, still unarchived, carries the requirement "A suite that produces evidence runs on its own manually dispatched workflow", which this change contradicts] → Mitigation: flagged rather than edited. That change's delta is its own record and is not rewritten here; when it archives, its requirement has to be reconciled against the two added by this change, and the person archiving it decides which wins.
