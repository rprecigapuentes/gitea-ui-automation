## Context

See `proposal.md` — Why. What shapes the approach is where each piece can physically run.

The workflow executes on a self-hosted `act_runner` on the `gitea-lab` VPS, in Docker mode. Its `container.network` is `""`, so every job gets a fresh network of its own and jobs are deliberately kept off any long-lived stack's bridge: registration on that Gitea is open, so a pushed workflow placed on the shared bridge could reach the lab's unauthenticated mailbox. Jobs are also denied the Docker socket.

Inside that per-job network, `gitea-test` and the browser already sit side by side, which is why `http://gitea-test:3000` resolves today. The browser is what loads that URL, not the test process.

Healenium's data plane is already deployed and verified on the same host as a separate Compose stack in `automindai-infra`: Postgres with a named volume, `hlm-backend`, `selector-imitator`, and a Cloudflare tunnel of its own. It is reachable only by public hostname.

## Goals / Non-Goals

**Goals:**

- Keep every part that touches the application under test inside the job, so the existing app-under-test path is unchanged by this work.
- Make the matrix contract a property of the workspaces themselves, so adding a suite later is a package.json change and not a workflow rewrite.
- Fail loudly and early when the external store is unreachable, rather than running a suite that silently cannot heal.

**Non-Goals:**

- Making healing a merge gate. `ct.yml` is scheduled; `ci.yml` stays lint, format and typecheck only.
- Tuning healing quality (score thresholds, recovery attempts) beyond upstream defaults.
- Running suites concurrently. See the parallelism decision below.

## Decisions

### The store is persistent; the proxy and the grid are not

Only Postgres, the backend and the imitator live outside the job. `hlm-proxy` and the Selenium container are created per job.

The alternative was moving the browser to the VPS alongside a long-lived grid. It does not work: a browser outside the job cannot resolve `gitea-test`, a name that exists only inside a network on a machine it cannot enter, and inbound access to a per-job network is not possible at all. Every workaround for that — a tunnel exposing the application under test, or putting jobs on a shared bridge — adds a moving part or reopens the mailbox problem. Keeping the browser in the job removes the problem instead of routing around it.

The opposite extreme, an ephemeral store, was rejected on the mechanics: healing compares against a node path recorded on an earlier run, so a store created per job never heals. A third option, persisting only Postgres and running the backend per job, was rejected because it means exposing a database port instead of an HTTP service and because the screenshots a heal produces live on the backend.

### The job reaches the store by public hostname

The proxy calls the backend and the imitator over their Cloudflare hostnames, the same path `act_runner` already takes to reach Gitea itself. This is an outbound call from the job, which always works, rather than inbound into an ephemeral network, which never does. It also requires no change to `runner-config.yaml`, and publishes no port on the host.

### The matrix is computed inline, from the `github` context alone

A scheduled or pushed run supplies no dispatch input, so `github.event.inputs.suite` arrives empty and the matrix has to express "then run everything".

The obvious shape — a small job emitting the list as JSON, read back through `fromJSON(needs.select.outputs.suites)` — was built first and does not work here. `act_runner`, which Gitea Actions is built on, resolves `strategy.matrix` while planning the run, before any job has produced an output. The expression evaluates to `invalid`, and the workflow is rejected as unparseable before anything executes: `Cannot parse non-string type invalid as JSON`.

The matrix therefore reads only the `github` context, which is fully populated at planning time, and the `select` job is gone. The cost is one folded expression in place of a readable shell `if`.

Rejected alternatives: an `if:` per suite over a fixed set of jobs duplicates the entire job body, and a job-level `if:` cannot see the `matrix` context in any case; looping over the suites inside a single job would share one `gitea-test` between them, losing the isolation each suite has now.

### The matrix key is the workspace name, and the contract is its `test` script

Both selenium workspaces already expose `test`, so a job runs `npm test -w @gitea-automation/<suite>` with no per-suite branching. The alternative was mapping each suite to a root script (`npm test`, `npm run test:cucumber`), which puts the list of suites in two places and drifts.

`services/playwright-native` and `services/playwright-bdd` have no `test` script and stay out until they do.

`gitea-selenium-cucumber` has no `report` script. It gains one, rather than making the report step conditional: a suite that cannot publish a report is a gap to close, not a case to branch on.

### Suites run one at a time

`max-parallel: 1`. Each matrix job starts a job container plus `gitea-test`, a browser and the proxy, and the runner's capacity is 2 on a small VPS shared with the Git server itself. `fail-fast: false` so that the Cucumber suite, which is still under construction, cannot cancel the vitest results.

Serial execution also sidesteps two jobs writing baselines for the same locators at the same time, though that is a side benefit rather than the reason.

### The Selenium container stays as it is

`selenium/standalone-all-browsers` is kept rather than adopting the hub-and-three-nodes layout from Healenium's published compose file. It is one container instead of four for the same three browsers, and the proxy does not care which it forwards to.

## Risks / Trade-offs

- **Healing hides a real regression.** A locator that broke because the application broke gets healed and the suite stays green. → `ct.yml` is scheduled, not a merge gate; `FIND_ELEMENTS_AUTO_HEALING` stays off upstream-side; heals are visible in the backend's report and are meant to be read as debt, not as a pass.
- **The pipeline now depends on a service outside this repository.** A run cannot be green while the VPS stack is down. → The readiness step fails the job by name before any test runs, which is the spec'd behavior; the store is on the same host as the runner, so its availability is not a separate network's problem.
- **The store is unauthenticated on a disposable host.** → Accepted for the duration of the bootcamp and documented on the infrastructure side; the data regenerates on the next green run, and the closing move (Cloudflare Access with an IP bypass for the job) is written down there.
- **Baselines invalidate if the backend's `KEY_SELECTOR_URL` is ever turned on**, because the application under test has no stable URL between runs. → Recorded in the stack's own compose file, where the flag lives.
- **Serial suites lengthen the run.** → Acceptable on a nightly schedule; `max-parallel` is one number to raise once the host is measured.

## Migration Plan

The two halves land in order and are verified separately.

1. The matrix, with `SELENIUM_REMOTE_URL` still pointing at the Selenium container. Verifiable on its own: dispatch manually, confirm one suite runs; let a scheduled run confirm both do.
2. The proxy. Verifiable only once the VPS stack is reachable from a job.

Rollback for the second half is pointing `SELENIUM_REMOTE_URL` back at `http://selenium:4444` and dropping the proxy service. The suites run unhealed, exactly as they do today.

## Open Questions

- Whether `github.event.inputs` populates reliably on this `act_runner` release. GitHub Actions supports both it and the `inputs` context; `act_runner` is less consistent. It now carries the whole selection, but it fails in the safe direction: an unpopulated input falls through to running every suite, so a manual run asking for one would run both rather than none. Answered by the first manual dispatch, and the fallback — reading the other context — changes one expression and neither the specs nor the task breakdown.
