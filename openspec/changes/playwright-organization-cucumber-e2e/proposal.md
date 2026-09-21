# Proposal

## Why

The `@e2e` scenario of `organizations.feature` ("Change team members permissions") is the one Cucumber case the Playwright service does not run. To compare the runners on it, it has to run on Playwright, on the same browsers, in parallel, through the same page objects.

## What Changes

- Add `tests/organization-cucumber-e2e.spec.ts` to `services/playwright-native`, one test that replicates the scenario step by step: create an organization, teams, members, a repository and files, then revoke code access and remove members while switching between the owner and two users.
- Add a `seededUsers` fixture to `fixtures/hooks-fixtures.ts`, the counterpart of the Cucumber suite's `createSeededUsers`: two users created through the admin API before the test and deleted after it, so "user 1" and "user 2" exist per browser and per run.
- Add `resolveAdminToken` to `fixtures/credentials.ts`, reading `GITEA_ADMIN_TOKEN`.
- Mint that token in the `playwright-native` job of `ct.yml`, as the Selenium job does: the job already registers an administrator, so it only needs the token and the check that it holds `write:admin`.
- Land it in commits of one responsibility each: the fixture and credentials, the pipeline, the test.

## Capabilities

No requirement text changes: an existing scenario is ported to a runner that already has its fixture layer. `skip_specs: true`.

## Impact

New: `services/playwright-native/tests/organization-cucumber-e2e.spec.ts`. Modified: `services/playwright-native/fixtures/credentials.ts`, `services/playwright-native/fixtures/hooks-fixtures.ts`, `.gitea/workflows/ct.yml`, `services/playwright-native/README.md`.

## Out of Scope

- The other Cucumber features and the smokes already ported.
- A Gherkin layer: `playwright-bdd` stays reserved.
- Changes to page objects or the strategies, unless a step fails on Playwright for a reason only they can fix.
