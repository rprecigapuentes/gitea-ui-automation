# Proposal

## Why

The organization end-to-end test exists only for Vitest + Selenium. To compare the two runners under the same conditions, the same scenario has to run on Playwright's native runner, on the same browsers, in parallel, through the same page objects.

## What Changes

- Add `tests/organization.spec.ts` to `services/playwright-native`, replicating `gitea-selenium-vitest/tests/organizations.test.ts` step by step: create an organization, create two private teams, add the invited user to the first, remove them, and review the persisted Teams state. It reaches the browser only through `pageObjects`, with the same methods and assertions; Allure steps become `test.step`.
- Add an `ORGANIZATION_TAG` and a `cleanupOrganizationsBeforeRun` automatic fixture to `fixtures/hooks-fixtures.ts`, the counterpart of Vitest's file-scoped fixture of that name; the test does not reference it. It removes leftovers of a crashed run, and only those with the test's own name prefix, so a parallel worker's data is never touched.
- Reuse the existing `cleanupCreatedOrganization` auto fixture for teardown.
- Align `PlaywrightInteractionStrategy` with the Selenium contract the page objects assume, only where the port needs it: `isVisible` honours its `root`, `type` appends keystrokes and `getAttribute("value")` reads the live value. `hasUserSearchResults` waits for the list through `waitUntil`, so it holds on both strategies.
- Give the `playwright-native` job of `ct.yml` the invited accounts the spec needs: their `GITEA_INV_<BROWSER>` variables and their registration, as the Selenium job already does.
- Document the spec, the fixture and those three points in the READMEs.

## Capabilities

No requirement text changes: an existing scenario is ported to a runner that already has its fixture layer. `skip_specs: true`.

## Impact

New: `services/playwright-native/tests/organization.spec.ts`. Modified: `.gitea/workflows/ct.yml`, `core/page-objects/strategies/playwright-interaction.strategy.ts`, `core/page-objects/README.md`, `services/playwright-native/fixtures/hooks-fixtures.ts`, `services/playwright-native/README.md`.

## Out of Scope

- Changes to page objects or the Selenium/Vitest suite.
- The comparison itself (timings, flakiness): a later task.
