# Proposal

## Why

The organization end-to-end test exists only for Vitest + Selenium. To compare the two runners under the same conditions, the same scenario has to run on Playwright's native runner, on the same browsers, in parallel, through the same page objects.

## What Changes

- Add `tests/organization.spec.ts` to `services/playwright-native`, replicating `gitea-selenium-vitest/tests/organizations.test.ts` step by step: create an organization, create two private teams, add the invited user to the first, remove them, and review the persisted Teams state. It reaches the browser only through `pageObjects`, with the same methods and assertions; Allure steps become `test.step`.
- Add an `ORGANIZATION_TAG` and a `cleanupOrganizationsBeforeRun` fixture to `fixtures/hooks-fixtures.ts`, the counterpart of Vitest's file-scoped fixture of that name. It removes leftovers of a crashed run, and only those with the test's own name prefix, so a parallel worker's data is never touched.
- Reuse the existing `cleanupCreatedOrganization` auto fixture for teardown.
- Document the spec and the fixture in the service README.

## Capabilities

No requirement text changes: an existing scenario is ported to a runner that already has its fixture layer. `skip_specs: true`.

## Impact

New: `services/playwright-native/tests/organization.spec.ts`. Modified: `services/playwright-native/fixtures/hooks-fixtures.ts`, `services/playwright-native/README.md`.

## Out of Scope

- Changes to page objects, the Selenium/Vitest suite or `PlaywrightInteractionStrategy`, unless a step fails on Playwright for a reason only they can fix.
- The comparison itself (timings, flakiness): a later task.
- CI wiring: the functional projects already run every spec in `tests/`.
