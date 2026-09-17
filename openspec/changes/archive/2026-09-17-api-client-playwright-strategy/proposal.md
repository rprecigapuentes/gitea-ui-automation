## Why

`core/api-client`'s design already names its deferred piece: `GiteaApiClient` builds a `GotRequestStrategy` internally because "no such handle exists yet for API requests — there's nothing to inject until a second strategy actually exists." That second strategy is now wanted. Unlike UI interactions, Playwright's `APIRequestContext` makes real HTTP calls without a browser page, so this doesn't need a console.log-stub phase the way `PlaywrightInteractionStrategy` did — it can be fully functional from the start.

## What Changes

- `core/api-client` gains `PlaywrightRequestStrategy` (`get`/`post`/`put`/`delete` via `@playwright/test`'s `request.newContext()`), plus `createPlaywrightStrategy(baseUrl, token)`.
- `GiteaApiClient`'s constructor changes from `(baseUrl, token)` to `(strategy: IRequestStrategy)` — the injection point the design doc said would arrive with the second strategy, mirroring `BaseComponent` in `core/page-objects`.
- All 14 construction sites across `business-logic/selenium/api/clients/*.client.ts` callers (`fixture.ts`, `hooks.ts`, `seeded-users.ts`, `organizations.steps.ts`) change from `new XClient(baseUrl, token)` to `new XClient(createGotStrategy(baseUrl, token))`. None switch to Playwright yet — nothing in the suites needs to today.

### Out of scope

- `auth.client.ts` — unchanged, as already decided in `core/api-client`'s original design.
- Actually wiring any client to `PlaywrightRequestStrategy` in a real test/fixture. This change makes the strategy exist and be usable; choosing it over `got` anywhere is a future call once there's a reason to (e.g. a Playwright-based suite that needs API seeding).
- Retrying, timeouts, or any behavior beyond matching `GotRequestStrategy`'s existing contract (parsed body on success, throw on non-2xx).

## Capabilities

No requirement text changes — same as the prior api-client change, this completes an existing, already-named abstraction. `skip_specs: true`.

## Impact

New: `core/api-client/playwright-request-strategy.ts`. Modified: `core/api-client/gitea-api-client.ts`, `core/api-client/package.json`, `core/api-client/README.md`, `business-logic/selenium/api/clients/{issue,label,milestone,repository,organizations,team,user}.client.ts` (only if the base class import path changes — verify during implementation), `services/gitea-selenium-vitest/src/fixtures/fixture.ts`, `services/gitea-selenium-cucumber/features/support/hooks.ts`, `services/gitea-selenium-cucumber/features/support/seeded-users.ts`, `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`.
