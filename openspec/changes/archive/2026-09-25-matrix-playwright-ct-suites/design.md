## Context

The Selenium job runs its two suites as a matrix, so each gets a fresh `gitea-test` and the job's own timeout. The Playwright job briefly ran them as two jobs and then as one job with sequential steps.

## Decisions

- **A matrix, not a shared job.** A shared job shares one Gitea and one timeout. A crash before teardown leaves the instance dirty for the next suite, and a hang spends the time of both. Matrix entries pay for a second provisioning and in exchange fail independently.
- **A matrix, not two jobs.** Two jobs work but copy about 150 lines of provisioning and repeat the dispatch condition per job. The matrix keeps one definition, and `max-parallel: 1` keeps one Gitea on the VPS at a time.
- **The matrix comes from the dispatch input**, as the Selenium job's does, because act_runner plans it before any step runs.
- **Suite names stay in the step names.** A matrix entry's job is already named after its suite, but the step is what a reader of a log looks at.
- **The timeout returns to 25 minutes per entry**, since each entry again carries one suite.
