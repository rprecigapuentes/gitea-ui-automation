# Design

## Why this artifact exists

The change touches two layers, the Playwright service and the pipeline, and it decides what a failing accessibility scan means. That decision is not obvious from the code it produces, so it is recorded here rather than argued again in review.

## What a scan asserts

The Playwright documentation opens with `expect(accessibilityScanResults.violations).toEqual([])`. That assertion states that the page is free of machine-detectable violations, which is true of no page the framework can reach today. Three ways out were considered.

| Option                      | A scan fails when                                     | Cost                                                                                                   |
| --------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Evidence only, no assertion | Never                                                 | The suite cannot regress, so nothing is learned from a second run                                      |
| Impact threshold            | A `critical` or `serious` violation is present        | Fails from the first run until every existing finding is excluded, one exclusion at a time             |
| Fingerprint baseline        | A violation appears that the baseline does not record | A baseline has to be generated once per page and browser, and re-approved when the application changes |

The fingerprint baseline is chosen. It is the option the documentation itself offers under _Handling known issues_, it keeps the suite capable of failing, and the committed baseline doubles as the inventory the issue asks to triage by severity. `exclude()` and `disableRules()` are deliberately left unused: both hide a finding from the report, and the report is the deliverable.

The fingerprint is `{ rule, targets }` per violation, as documented. Snapshotting the raw axe result would break on every run: it carries timings, the page URL and the full HTML of each offending node.

## Why the scans are their own projects

A Playwright project is a browser paired with a configuration, so an area is one project per browser it can run on. The alternative, selecting the scans by tag inside the existing projects, cannot give an area settings of its own: accessibility wants no retries and no trace, visual regression will want its own snapshot configuration, and performance will want a single worker. The `non-functional/` directory is ignored by the functional projects, so a scan never runs twice and `npm test` keeps meaning the functional suite.

The default is bundled Chromium alone. The first recorded baselines were byte-identical across chrome, firefox and edge, which is what an engine reading the DOM should produce, so running three browsers bought three copies of one answer. The branded projects stay defined and share that one baseline, so re-checking across engines is a flag away and a divergence fails against the shared baseline rather than quietly recording a second. `color-contrast` is the rule that could plausibly diverge, since it reads computed styles.

## Why a separate workflow

`ct.yml` is scheduled and gates nothing, but it is the run people read for a functional verdict. A suite whose expected outcome is a report, and whose baseline will be re-approved by hand, does not belong in that answer. `accessibility.yml` carries the same container, service and account seeding as the Playwright job, and is dispatch-only. Gitea issue 108 later decides whether the non-functional suites rejoin the scheduled run.
