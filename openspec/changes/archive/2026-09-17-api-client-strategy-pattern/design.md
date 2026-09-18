## Context

See proposal.md - Why. Confirmed by reading all 8 client files and every construction/consumption site: every one of the 7 `GiteaApiClient` subclasses calls `this.client.<verb>()` (the raw `got` instance) directly for every method — 10 methods total, zero calls to the base class's own `get()`. Every caller of a client method reads only `.body` off the returned `got` `Response` (never `.statusCode` or any other field), confirmed across `fixture.ts`, `hooks.ts`, and `seeded-users.ts`.

## Goals / Non-Goals

**Goals:**

- A concrete client calls only `get`/`post`/`put`/`delete` on its base class, never `got` directly, and imports nothing from `got`.
- The new abstraction lives somewhere a future Playwright request strategy can join without moving files again — `core/api-client`, mirroring `core/page-objects`.
- No client's public constructor changes, so no consumer's construction call site changes.

**Non-Goals:**

- A working Playwright request strategy. `IRequestStrategy` exists so one can be added later; only `GotRequestStrategy` is implemented now.
- Touching `auth.client.ts` — it doesn't fit the JSON get/post/put/delete shape (cookie jar, form body, redirect-based failure detection) and forcing it in would mean inventing an abstraction it doesn't actually need.
- Query params, custom headers, or any `IRequestStrategy` method beyond the four asked for. Nothing currently in use needs them.

## Decisions

**`IRequestStrategy` returns the parsed body directly (`Promise<T>`), not a `{body, statusCode}` wrapper.** Every caller in the codebase already only reads `.body` — returning the value itself is a straight simplification, not a behavior change, and it's what makes callers stop needing to know a `got`-shaped `Response` was ever involved.

**`GiteaApiClient` keeps its `(baseUrl, token)` constructor and builds a `GotRequestStrategy` internally**, rather than taking an injected `IRequestStrategy` the way `LoginPage` takes an `IInteractionStrategy`. Page objects needed injection because the native handle (`WebDriver` vs `Page`) already exists by the time a page is constructed, and picking between them can't be automatic. No such handle exists yet for API requests — there's nothing to inject until a second strategy actually exists. Injecting a single-implementation interface now would be speculative; the interface itself is the only piece worth having early.

**`organizations.client.ts`'s and `team.client.ts`'s locally-declared `Organization`/`Team` interfaces are renamed to `OrganizationSummary`/`TeamSummary`.** Neither is imported anywhere outside its own file (confirmed), so the rename is fully local, and it removes a same-name, different-shape collision with the unrelated `Organization`/`Team` in `entities/` that had nothing to do with this refactor's goal but was directly in the way of retyping these two files' return values.

**`core/selenium/api/` is deleted outright, not left with a re-export.** It held exactly one file. Once that file moves, nothing remains under it, and nothing needs a compatibility shim since every importer is migrated in the same commit.

## Risks / Trade-offs

- **Changing 7 clients' return types from `Response<T>` to `T` breaks every caller in the same instant** — not something that can be split into independently-green commits without a temporary dual API. Accepted: clients and callers migrate together in one commit.
- **`core/selenium/package.json` loses `got` and `@gitea-automation/core-logger`** once `gitea-client.client.ts` moves out — confirmed neither is used anywhere else under `core/selenium/` (`drivers/`, `utils/`, `config/`), so this isn't a guess.
- **No error normalization is introduced.** `got`'s `HTTPError` still propagates raw from `GotRequestStrategy` on non-2xx responses, exactly as today — nothing in the codebase currently catches or branches on its type (the one `try/catch`, in `deleteAllOrganizations`, just logs and continues regardless of error shape), so there's no observed need to wrap it yet.
