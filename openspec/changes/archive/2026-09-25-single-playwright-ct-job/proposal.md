## Why

The Selenium job runs its two suites inside one job, and a reader of its log cannot tell which suite a step belongs to. The two Playwright suites should behave the same way: one `playwright` job, provisioned once, whose steps run each suite in turn and say which one they are. The last change split them into two jobs, which is not what was asked for.

## What Changes

- Merge `playwright-native` and `playwright-bdd` back into one `playwright` job. It provisions Gitea, the browsers and the accounts once, then runs the native suite and the BDD suite one after the other in the same job.
- The job's steps after provisioning read: `Run the suite (playwright-native)`, `Generate the Allure report (playwright-native)`, `Upload the report (playwright-native)`, then the same three for `playwright-bdd`. Each suite still uploads its own `allure-report-<suite>` artifact.
- The BDD steps run even when the native suite failed, and the job still fails. They do not run when provisioning failed.
- A dispatch naming one Playwright suite runs only that suite's three steps; the job's condition still covers either.
- The job timeout grows to cover two suites.

## Capabilities

### Modified Capabilities

- `pipeline`: the workflow's unit is a job per browser-launching image rather than one per suite, and the Playwright suites are told apart by their steps.

## Impact

Modified: `.gitea/workflows/ct-functional.yml`.

## Out of Scope

- The Selenium job, which is left as it is.
- Making `playwright-native` run its browsers concurrently on CI.
- A separate Gitea per Playwright suite: they share the instance and its accounts, and the BDD suite only logs in.
