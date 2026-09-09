## 1. Report parity for the Cucumber workspace

- [x] 1.1 Give `@gitea-automation/gitea-selenium-cucumber` Allure reporting: add the Cucumber Allure formatter as a devDependency, wire it in `services/gitea-selenium-cucumber/cucumber.mjs` to write into `allure-results/`, and add `report` and `report:open` scripts mirroring the vitest workspace. Verify by running `npm test -w @gitea-automation/gitea-selenium-cucumber` locally and confirming `allure-results/` is populated, then `npm run report -w @gitea-automation/gitea-selenium-cucumber` and confirming `allure-report/index.html` is generated. The workspace has no Allure dependency today, so this is wiring, not a script alias.

## 2. Suite selection in ct.yml

- [x] 2.1 Add the `suite` choice input to `workflow_dispatch` and compute the matrix from it, falling back to every test-bearing workspace when no input is supplied. It has to be computed from the `github` context inline: `act_runner` plans the matrix before any job output exists, so a `select` job feeding `fromJSON(needs...)` is rejected as unparseable. Verify with two manual dispatches: one naming a single suite, whose `select` output must hold only that suite, and one asking for all, whose output must hold both. Confirm on the same run which input context `act_runner` actually populates, per the open question in `design.md`.
- [x] 2.2 Turn the `regression` job into a matrix over `select`'s output, running `npm test -w @gitea-automation/${{ matrix.suite }}`, with `fail-fast: false` and `max-parallel: 1`. Leave `SELENIUM_REMOTE_URL` pointed at the Selenium container for now. Verify that an all-suites run produces one job per suite, that each provisions its own `gitea-test` and browser, and that a failing suite does not cancel the other.
- [x] 2.3 Make the report step and the uploaded artifact per suite: generate with `-w @gitea-automation/${{ matrix.suite }}` and name the artifact after the suite. Verify that a two-suite run yields two artifacts with distinct names, both downloadable, and that the artifact of a deliberately failed suite is still uploaded.

## 3. Routing the browser through Healenium

- [x] 3.1 Add `hlm-proxy` as a service container in the `regression` job, configured to forward to the in-job Selenium container and to reach the backend and the imitator by their public hostnames. Verify by curling the proxy's status endpoint from the job and seeing it report ready.
- [x] 3.2 Point `SELENIUM_REMOTE_URL` at the proxy and retarget the browser-readiness step at the same URL. Verify that a full run passes with no framework code change, and that the run's selectors appear in the Healenium backend afterwards, which is what proves the persistent store is being written rather than a per-job one.
- [ ] 3.3 Verify the failure mode across 3.1 and 3.2: with the backend unreachable, the job must fail at the readiness step, before any test executes, and the failure must name the component that did not answer. Confirm the suite does not fall through to running unhealed.

## 4. Documentation

- [x] 4.1 Update the CI/CD section of the root `README.md`, which still describes `ct.yml` as deploying a Gitea and a Selenium and running the vitest suite alone. State which suites run, how to select one manually, and that the pipeline depends on the Healenium stack deployed from `automindai-infra`. Verify by reading it against the final `ct.yml`.
