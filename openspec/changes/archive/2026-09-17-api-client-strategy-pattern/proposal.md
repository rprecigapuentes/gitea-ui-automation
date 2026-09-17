## Why

`GiteaApiClient` (`core/selenium/api/gitea-client.client.ts`) exposes exactly one method (`get`, untyped, returns `got`'s raw `Response`). All 7 concrete clients extending it (`issue`, `label`, `milestone`, `repository`, `organizations`, `team`, `user`) never call it — every one reaches past it into `this.client` (the `protected` `got` instance) to do typed `get`/`post`/`delete` directly. The base class's own abstraction is dead code; every concrete client already knows it's `got` underneath. Before a future Playwright-based request strategy can exist, the base client needs to actually own the request/response mechanics, the same way `core/page-objects` already does for browser interaction.

## What Changes

- New workspace `core/api-client` (`@gitea-automation/core-api-client`) holds `IRequestStrategy` (`get`/`post`/`put`/`delete`, returning the parsed body directly), `GotRequestStrategy` (real port of today's `got.extend()` setup), and `GiteaApiClient` (unchanged public constructor `(baseUrl, token)`, builds a `GotRequestStrategy` internally, exposes `get`/`post`/`put`/`delete` to subclasses).
- All 7 concrete clients migrate to the new `GiteaApiClient`, calling `this.get/post/put/delete` instead of `this.client.*`, returning `Promise<T>` instead of `Promise<Response<T>>`. No concrete client imports anything from `got` afterward.
- `organizations.client.ts` and `team.client.ts` rename their locally-declared `Organization`/`Team` interfaces (which collide in name, but not shape, with the unrelated `Organization`/`Team` in `entities/`) to `OrganizationSummary`/`TeamSummary`.
- Every caller that destructured `.body` off a client call (`fixture.ts`, `hooks.ts`, `seeded-users.ts`) updates to use the value directly.
- `core/selenium/api/gitea-client.client.ts` and its now-empty `api/` folder are retired.

### Out of scope

- `auth.client.ts`. It doesn't extend `GiteaApiClient` today, uses a cookie jar, a form-encoded (not JSON) body, and redirect-URL-based failure detection instead of HTTP status — none of which fits a generic `get/post/put/delete` abstraction. Left untouched.
- Any Playwright-based request strategy. `IRequestStrategy` exists so one can be added later without moving anything again, but only `GotRequestStrategy` is implemented now.
- Changing any concrete client's constructor signature. Every one keeps taking `(baseUrl, token)`; `GiteaApiClient` builds the strategy internally, so every existing construction call site (`fixture.ts`, `hooks.ts`, `seeded-users.ts`, `organizations.steps.ts`) is untouched.
- Adding query-parameter or custom-header support to `IRequestStrategy`. Nothing in the 7 clients uses either today.

## Capabilities

No requirement text changes — this relocates and completes an existing abstraction (the base API client owning request mechanics) without changing what any client is contractually allowed or required to do. `.openspec.yaml` sets `skip_specs: true`.

## Impact

New: `core/api-client/**`. Modified: all 7 files under `business-logic/selenium/api/clients/` (all but `auth.client.ts`), `business-logic/selenium/package.json`, `services/gitea-selenium-vitest/src/fixtures/fixture.ts`, `services/gitea-selenium-cucumber/features/support/hooks.ts`, `services/gitea-selenium-cucumber/features/support/seeded-users.ts`. Removed: `core/selenium/api/gitea-client.client.ts`. `core/selenium/package.json` drops `got` and `@gitea-automation/core-logger`.
