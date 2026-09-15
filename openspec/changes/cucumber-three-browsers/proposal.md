## Why

The continuous-testing workflow runs each suite through its `test` script. For `gitea-selenium-cucumber` that script is a bare `cucumber-js`, which the driver factory and the credentials resolve to chrome, so every CT run of the Cucumber suite has covered one browser while the vitest suite covers three. The pipeline provisions accounts and tokens for firefox and edge that the Cucumber job never uses, and the report cannot say which browser a scenario ran on because nothing labels it.

## What Changes

- `gitea-selenium-cucumber`'s `test` script runs the three browsers as three concurrent `cucumber-js` processes, the same shape `test:parallel` already has and the vitest suite already uses in CT. `test:parallel` stays as the explicit name for it.
- Each scenario's Allure result carries a `browser` parameter, set from `BROWSER` in the scenario hook, as the vitest suite does in its `beforeEach`. Without it three passes of one scenario are indistinguishable in the report.
- The suite's README and the root README stop describing `npm test` and `npm run test:cucumber` as chrome-only.

### Out of scope

- `ct.yml`. The workflow already calls `npm test -w <suite>` and its grid already allows three sessions; the change is in the suite's contract, not in the workflow.
- Running the browsers one after another. The per-browser owner accounts, tokens and seeded users already exist so that the processes do not collide.
- `bs.yml` and the BrowserStack path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pipeline`: gains the requirement that a suite's `test` entry point drives every browser the framework supports, and that each result names its browser.

## Impact

`services/gitea-selenium-cucumber/package.json`, `features/support/hooks.ts`, `services/gitea-selenium-cucumber/README.md`, root `README.md`. The Cucumber job runs three browser processes at once against one `gitea-test`, as the vitest job already does; wall time should stay close to today's single-browser run.
