## Context

The `playwright` job has a one-entry matrix and a shared command, `npm test -w <suite>`. Adding `playwright-bdd` to that matrix reuses the image, the account registration and the report steps, and `max-parallel: 1` with `needs: selenium` keeps one Gitea on the VPS at a time. Each matrix execution starts its own `gitea-test` service, so the second suite gets a fresh instance and its accounts are registered again.

## Decisions

- **Same job, longer matrix, not a second job.** A second job would repeat about 150 lines of provisioning. The matrix runs its entries in order, so the BDD suite follows the native one.
- **The matrix is derived from the dispatch input**, as the Selenium job's is, because act_runner plans the matrix before any step runs and a static list would run both suites whatever was dispatched.
- **Concurrency comes from the suite's `test` script**, not from the workflow. `playwright-native` runs three projects in one worker on CI because `workers` is 1 there. `playwright-bdd`'s `test` becomes the three-process `test:parallel`, one worker each, the shape `gitea-selenium-cucumber` has. This keeps the workflow command the same for every suite, and keeps one worker per browser since a browser's scenarios share its account.
- **Step names carry `matrix.suite`.** The job name already does, but the step is what a reader of a log looks at.
- **Nothing in the workflow opens the Allure report.** The wrapper of the BDD scripts already skips it when `CI` is set.
