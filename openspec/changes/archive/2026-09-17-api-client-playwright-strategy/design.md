## Context

See proposal.md - Why. This touches two layers (`core/api-client` and every caller that constructs a client), and introduces a real second implementation of a Strategy pattern already scaffolded but never exercised — the same shape as `core/page-objects`' design.md, worth writing down for the same reason: the constructor-injection decision affects every construction call site in the repo.

## Goals / Non-Goals

**Goals:**

- `PlaywrightRequestStrategy` is a real, working `IRequestStrategy` implementation — verified against the local Gitea instance, not just typechecked.
- `GiteaApiClient` becomes the injection point: it takes an `IRequestStrategy` and delegates, exactly like `BaseComponent`. No client subclass changes — they still only ever call `this.get/post/put/delete`.
- Existing behavior is unchanged: every current call site keeps using `got`.

**Non-Goals:**

- Switching any real suite to Playwright for API calls. Nothing today needs it; this only makes the option exist.
- A shared `APIRequestContext` across multiple clients/strategies. Each `PlaywrightRequestStrategy` owns its own context, matching how each `GotRequestStrategy` owns its own `got.extend()` instance today.

## Decisions

**`GiteaApiClient` moves to constructor injection now.** The original api-client design explicitly deferred this ("there's nothing to inject until a second strategy actually exists") — that condition is now met. Every one of the 14 construction sites (`fixture.ts`, `hooks.ts`, `seeded-users.ts`, `organizations.steps.ts`) changes from `new XClient(baseUrl, token)` to `new XClient(createGotStrategy(baseUrl, token))`, mirroring how `page.factory.ts`/`fixture.ts` already call `createSeleniumStrategy(driver)` at each page construction site rather than hiding it inside the page.

**`PlaywrightRequestStrategy` builds its own `APIRequestContext` via `request.newContext()`**, not via an injected `Page`/`APIRequestContext` — API clients aren't tied to a browser page's lifecycle the way UI interactions are, and `@playwright/test`'s `request` fixture works standalone. It takes `(baseUrl, token)`, matching `GotRequestStrategy`'s own constructor shape, and lazily creates the context on first use (constructing it is itself an async operation, and `IRequestStrategy` methods are the only async boundary available).

**Empty response bodies (204, or any endpoint returning no body) resolve to `undefined`** rather than throwing on `JSON.parse("")`. Read the response as text first; parse only if non-empty. `delete<T = void>` is the method this matters for — nothing calls it expecting a value back.

**Client construction stays out of Cucumber step definitions.** `organizations.steps.ts` originally built its own `OrganizationClient(createGotStrategy(...))` inline — a review comment caught this: steps should only reach clients/pages through the world or through hooks, never construct their own. Fixed by adding `organizationClient` to `GiteaWorld`, populated once per scenario in the general `Before` hook (`hooks.ts`) via the existing `ownerClients()` helper; the step now reads `this.organizationClient`.

## Risks / Trade-offs

- **Changing `GiteaApiClient`'s constructor breaks all 14 call sites at once** — same as the return-type change in the prior api-client refactor, this can't be split without a temporary dual constructor. Accepted: one commit touches the base class and every call site together.
- **No test in the repo exercises `PlaywrightRequestStrategy`** (nothing constructs a client with it). Verification is a standalone `tsx` smoke script against the local Gitea instance, not the real suites — same approach used to verify `PlaywrightInteractionStrategy` could be instantiated without crashing, but here checking actual HTTP round-trips since the strategy is fully implemented, not stubbed.
- **`PlaywrightRequestStrategy` does not throw on a non-ok response**, unlike `GotRequestStrategy`. A review comment flagged the original throw-on-non-ok wrapper as unnecessary for now — nothing yet constructs a client with this strategy, so there's no real caller depending on that behavior. Revisit if/when a real caller needs it.
