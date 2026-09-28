## Why

Review of the pull request pointed out that the Selenium job is a two-entry matrix, not one job with two suites, and that each entry gets its own fresh `gitea-test`. The last change put both Playwright suites in one job instead, which makes them share a Gitea and one timeout: a native suite that crashes before teardown or hangs would take the BDD suite down with it. The proposal of that change misdescribed the Selenium job, so it aimed at the wrong shape.

## What Changes

- Go back to one `playwright` job with a two-entry matrix, `playwright-native` and `playwright-bdd`, derived from the dispatch input as the Selenium job's is. Each entry provisions its own Gitea, browsers and accounts, and has the job's own 25-minute limit.
- Keep the suite's name in the steps that run, report and upload it (`Run the suite (playwright-bdd)`), so the log says which suite each step belongs to. The matrix removes the per-step `if` and the `accounts` step id the single job needed.
- The artifact of each entry stays `allure-report-<suite>`.

## Capabilities

### Modified Capabilities

- `pipeline`: each Playwright suite runs as its own matrix entry, with its own application under test, rather than sharing one job.

## Impact

Modified: `.gitea/workflows/ct-functional.yml`. The result is the workflow as it stood when `playwright-bdd` first joined the matrix.

## Out of Scope

- The Selenium job.
- Making `playwright-native` run its browsers concurrently on CI.
- Sharing the provisioning between jobs.
