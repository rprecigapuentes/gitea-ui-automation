## Context

The `playwright` job runs the native and BDD suites as two matrix entries. A matrix entry is not a job in the run's view, and its command, step names and artifact name all hang off `matrix.suite`.

## Decisions

- **Two jobs, copied.** `playwright-bdd` is the native job with its suite name in place of the matrix expression. The provisioning is about 150 lines and duplicating it matches how the Selenium and Playwright jobs already relate. A reusable workflow or a composite action would remove the copy, but act_runner handles neither reliably, and a broken CT run is worse than a long file.
- **The chain is `selenium` → `playwright-native` → `playwright-bdd`.** Each job `needs` the previous one and starts with `always()`, so a failure or a skipped predecessor never stops the next suite, and a dispatch naming one suite still reaches it through skipped predecessors.
- **Each job's `if` names only its own suite and `all`.** With no matrix left to shrink, the dispatch input is read in one place per job.
- **Suite names are literal** in step names, the workspace flag and the artifact name, so a reader of the file can see which job publishes what without evaluating an expression.
