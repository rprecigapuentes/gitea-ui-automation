# Tasks

## 1. Remove the healing path from the CT workflow

- [ ] 1.1 Drop the `hlm-proxy` service from `.gitea/workflows/ct.yml`, point `SELENIUM_REMOTE_URL` at `http://selenium:4444`, and rename the browser wait so it no longer names a proxy; verify `npm run format:check` passes and the wait step's failure message names the Selenium server.
- [ ] 1.2 Remove the step that fails the job when the healing store is unreachable; verify no step in `ct.yml` requests `healenium.estiberz.online`.
- [ ] 1.3 Remove the healing-evidence collection step, the `SUITE_STARTED_AT` step that only bounded its query window, and the `reports/healenium/` path from the upload; verify `grep -iE "healenium|hlm-proxy|SUITE_STARTED_AT" .gitea/workflows/ct.yml` returns nothing.

## 2. Bring the documentation in line

- [ ] 2.1 Rewrite the `ct.yml` bullet and delete the Healenium section of `README.md` so they describe the workflow that now exists; verify no occurrence of "Healenium" remains in `README.md` and `npm run format:check` passes.

## 3. Verify a green run

- [ ] 3.1 Dispatch CT manually for `gitea-selenium-vitest` and verify the job waits on Gitea and Selenium, runs the suite and uploads `allure-report-gitea-selenium-vitest`, with no step reaching a proxy or a store.
- [ ] 3.2 Dispatch CT manually for `gitea-selenium-cucumber` and verify the same, then let one scheduled run cover both and confirm it reports green.
- [ ] 3.3 Drop the temporary push trigger from `ct.yml` once a run on the branch is green; verify `on:` lists only `schedule` and `workflow_dispatch`.
