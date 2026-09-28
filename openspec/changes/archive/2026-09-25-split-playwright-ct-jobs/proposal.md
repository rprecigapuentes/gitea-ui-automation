## Why

`playwright-bdd` joined the continuous-testing workflow as a second entry of the `playwright` job's matrix. A run then shows one job, `playwright`, with two executions inside it, and the two suites cannot be told apart, retried or read as separate results the way a job of their own can. Each Playwright suite should have its own job.

## What Changes

- Replace the `playwright` job's matrix by two jobs, `playwright-native` and `playwright-bdd`. Each carries the same provisioning as today: its own `gitea-test`, the Playwright image, the browser accounts and the tokens.
- `playwright-bdd` waits on `playwright-native`, which waits on `selenium`, so one application under test runs on the VPS at a time. Each job runs whatever the previous one's outcome was.
- A dispatch naming one suite runs only that suite's job. The job's own condition decides it, so the dispatch-driven matrix goes away.
- The steps and the artifact of each job name their suite in the file itself: `Run the suite (playwright-bdd)`, `allure-report-playwright-bdd`.

## Capabilities

### Modified Capabilities

- `pipeline`: a Playwright suite is selected by its own job rather than by a matrix entry.

## Impact

Modified: `.gitea/workflows/ct-functional.yml`. No change to any suite, script or artifact name.

## Out of Scope

- Sharing the duplicated provisioning between the two jobs through a reusable workflow or an action: act_runner's support for both is uneven, and the Selenium and Playwright jobs already duplicate it.
- Making `playwright-native` run its browsers concurrently on CI.
- The Selenium job and the non-functional workflow.
