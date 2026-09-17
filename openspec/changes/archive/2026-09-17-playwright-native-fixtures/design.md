## Context

See proposal.md - Why. This touches three layers (`business-logic/common`, `gitea-selenium-cucumber`, `playwright-native`) and generalizes an existing class to constructor injection — the same shape of decision as `BaseComponent`/`GiteaApiClient` before it, worth writing down for the same reason.

## Goals / Non-Goals

**Goals:**

- `PageFactory` takes an `IInteractionStrategy`, not a `WebDriver` — no different from any page it assembles.
- `playwright-native`'s fixtures follow the exact same shape and naming already established: a `clients` object (mirrors `ownerClients()` in `gitea-selenium-cucumber/hooks.ts`), a `strategy` (mirrors `strategy` in `gitea-selenium-vitest`), a `pages` (mirrors `this.pages` in `gitea-selenium-cucumber`'s `GiteaWorld`), and `scenarioState` (identical shape in both other suites).
- The login-via-API test is a real, working end-to-end check, not a smoke script.

**Non-Goals:**

- Making `PlaywrightInteractionStrategy` real. Confirmed out of scope again after the login-via-UI test turned out to need it — `strategy`/`pages` are wired for when that work happens, not exercised by a passing UI test today.
- Touching `gitea-selenium-vitest`. It never used `PageFactory`.

## Decisions

**`PageFactory` moves to `business-logic/common/ui/page.factory.ts`.** It's a pure assembler of the pages that already live there — `business-logic/common` already depends on `core-page-objects` for `IInteractionStrategy`, so no new dependency is needed, only removing `selenium-webdriver`'s implicit coupling (it was never a declared dependency of this class's package, only of the type it imported). `gitea-selenium-cucumber`'s `hooks.ts` now calls `createSeleniumStrategy(this.driver)` itself before constructing `PageFactory`, exactly like `gitea-selenium-vitest`'s `strategy` fixture and `gitea-selenium-cucumber`'s own `Before` hook already do for pages built without `PageFactory`.

**`playwright-native`'s `clients` fixture uses `PlaywrightRequestStrategy`, not `GotRequestStrategy`.** The whole point of this change is to start exercising the Playwright-side abstractions for real, in a real test — using `got` here would compile but defeat that purpose. `AuthClient` stays as-is (`got`-based, cookie jar), consistent with it being out of scope for the api-client Strategy pattern.

**The login-via-API test asserts through Playwright's own `page`/`expect`, not through `pages`.** `LoginPage`/`MainPage`/`NavBarFragment` all delegate to the still-stubbed `PlaywrightInteractionStrategy`, so asserting "logged in" through them would pass or fail on stub behavior, not real page state. The test drives `context.addCookies()` and reads the real DOM directly with Playwright's own locators/`expect`, which is honest about what's actually implemented today and still fully verifies the `clients` fixture and the cookie-injection flow.

## Risks / Trade-offs

- **`strategy` and `pages` fixtures are added but unexercised by any test in this change.** Accepted per the explicit scope decision above — they typecheck and follow the established pattern, ready for the moment `PlaywrightInteractionStrategy` becomes real.
- **Relocating `PageFactory` changes its constructor signature**, which is a breaking change for its one caller (`gitea-selenium-cucumber/hooks.ts`). Only one call site exists (confirmed by grep), so this is a single-commit, fully-covered change.
