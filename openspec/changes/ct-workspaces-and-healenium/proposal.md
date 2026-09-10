## Why

The CT pipeline exercises one of the monorepo's four service workspaces and drives a throwaway Selenium container, so a locator that drifts fails the run outright and `gitea-selenium-cucumber` is never run at all. Healenium can heal a drifted locator, but only against a node path it stored on an earlier run that worked, which a per-job database can never hold. That store now exists: a persistent Healenium backend is deployed on the gitea-lab VPS. This change makes the pipeline use it, and widens the pipeline to every suite the monorepo actually has.

## What Changes

- `ct.yml` runs each test-bearing workspace as its own matrix job instead of only `@gitea-automation/gitea-selenium-vitest`.
- `workflow_dispatch` gains a `suite` choice input to run exactly one; `schedule` continues to run all of them.
- The Allure report step and the uploaded artifact become per suite. Today both are hardcoded to the vitest workspace, and one artifact name would collide across matrix jobs.
- `@gitea-automation/gitea-selenium-cucumber` gains a `report` script; it has `test` and `typecheck` only, so a shared report step cannot run against it.
- `hlm-proxy` joins the job as a service container. `SELENIUM_REMOTE_URL` points at the proxy instead of the Selenium container, and the readiness step follows it. The proxy reaches the persistent backend by public hostname; the browser and the Gitea under test stay co-located in the job's own network exactly as they are today.
- No framework code changes: `core/selenium/ui/drivers/driver.factory.ts` already reads `SELENIUM_REMOTE_URL` and passes it to `builder.usingServer()`.

### Out of scope

- The Healenium stack itself. It lives in the `automindai-infra` repository and is a prerequisite of this change, not part of it.
- `bs.yml` and the BrowserStack path, and `ci.yml`.
- The content of the Cucumber suite. This change runs it; it does not write it.
- Demonstrating an actual heal. That requires the application's DOM to change while the locator stays put, which is separate work.

## Capabilities

### New Capabilities

- `pipeline`: which suites the continuous-testing workflow runs, how one is selected for a manual run, how each suite's report is published, and how the browser is reached.

### Modified Capabilities

None. `openspec/specs/` holds no capabilities yet.

## Impact

`.gitea/workflows/ct.yml` and `services/gitea-selenium-cucumber/package.json`. Runtime dependency on the `healenium` stack on the gitea-lab host; a job that cannot reach it fails at the readiness step rather than running unhealed.
