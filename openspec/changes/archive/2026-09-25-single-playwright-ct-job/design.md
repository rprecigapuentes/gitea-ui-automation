## Context

The previous change gave each Playwright suite a job. A job shows up in a run as its own block, but the request is for one Playwright stage whose steps say which suite they belong to, the way the Selenium stage carries two suites.

## Decisions

- **One job, two groups of three steps.** Provisioning is written once, which removes the 150 duplicated lines the two-job form needed.
- **The BDD steps run under `always()`, gated on the accounts step's outcome.** A failed native suite must not stop the BDD one, but a failed provisioning would make it fail on a login for a reason that is not its own. The accounts step gets an `id` so the condition can read its outcome.
- **A dispatch is honoured per step.** With one job there is no job-level switch left, so each suite's three steps carry the condition the job used to.
- **The suites share one Gitea and its accounts.** The BDD suite only logs in, and the native suite cleans up the organizations it creates, so neither sees the other's data.
- **Timeout raised** from 25 to 40 minutes: two suites run under one limit that used to cover one.
