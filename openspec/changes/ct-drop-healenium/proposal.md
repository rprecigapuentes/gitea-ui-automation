# Proposal

## Why

Healenium is no longer available: permission to use it was withdrawn, and its containers on the gitea-lab VPS have been taken down. The CT workflow now stops before any test runs, because it deliberately fails when the healing store does not answer. The pipeline cannot go green again until the healing path is gone.

## What Changes

- Drop the `hlm-proxy` service from `ct.yml`, and point `SELENIUM_REMOTE_URL` back at the Selenium server (`http://selenium:4444`).
- Drop the step that refuses to run when the healing store is unreachable, and rename the browser wait so it no longer claims to pass through a proxy.
- Drop the healing-evidence collection step, the `SUITE_STARTED_AT` step that exists only to bound its query window, and the `reports/healenium/` path from the uploaded artifact.
- Update the README passages that describe the proxy as part of CT.
- **BREAKING**: a locator whose target has drifted now fails its test instead of resolving against a stored baseline. Nothing records or reads a baseline any more.

This is a surgical removal, not a revert to the last pre-Healenium workflow. Everything that landed after Healenium stays: the inline matrix expression, because a `select` job computing the matrix through outputs is what act_runner cannot plan; the `ct-admin` registration and its `write:admin` token; and the daily cron.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pipeline`: removes three requirements, "Suites reach the browser through the healing proxy", "The healing store outlives the run" and "A run publishes what the healing proxy did in each of its sessions".

## Impact

- `.gitea/workflows/ct.yml`: one service and three steps removed, one env value changed, one artifact path dropped.
- `openspec/specs/pipeline/spec.md`: three requirements removed.
- `README.md`: the `ct.yml` description and the Healenium section.
- No suite source changes. `core/selenium/ui/drivers/driver.factory.ts` reads `SELENIUM_REMOTE_URL` and never names the proxy, so only the value it receives changes.
- The in-flight `dashboard-readiness-waits` carries an open decision on `FIND_ELEMENTS_AUTO_HEALING`. This change settles it by removing its subject.

## Out of Scope

- Adding the Playwright suite to CT, and splitting the workflow into a Selenium job and a Playwright job. Both belong to a later change.
- Any replacement for self-healing locators: a drifted locator is fixed by hand.
- Tearing down the Healenium deployment itself, which lives in `automindai-infra`.
- `bs.yml` and the BrowserStack path, which never went through the proxy.
