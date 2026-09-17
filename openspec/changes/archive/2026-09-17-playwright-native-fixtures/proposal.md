## Why

`services/playwright-native` has an example test and browser matrix, but nothing wires it to any of the abstractions built this branch — `core/page-objects`, `core/api-client`, the business-logic pages. Its only fixture file (`fixtures/pages.fixture.ts`) is unused, uncommitted Playwright-generated boilerplate that doesn't even compile. Starting to use Playwright for real means giving it the same fixture layer `gitea-selenium-vitest`/`gitea-selenium-cucumber` already have: clients, an interaction strategy, a page factory, scenario state.

Doing this exposed one real gap: `PageFactory` (today only in `gitea-selenium-cucumber`) takes a raw `WebDriver` and builds its own `SeleniumInteractionStrategy` internally — the one piece of UI infrastructure that never got decoupled during the page-objects Strategy refactor. It has to move first.

## What Changes

- `PageFactory` moves to `business-logic/common/ui/page.factory.ts` and takes an already-built `IInteractionStrategy` instead of a `WebDriver`, mirroring how every page it assembles is already constructed. `gitea-selenium-cucumber`'s `hooks.ts`/`world.ts` update to the new location and call `createSeleniumStrategy(driver)` themselves before constructing it.
- `services/playwright-native` gains a fixture file with `clients` (the 7 Gitea API clients, built via `PlaywrightRequestStrategy`, plus `AuthClient`), `strategy` (`PlaywrightInteractionStrategy` wrapping Playwright's own `page`), `pages` (the relocated `PageFactory`), and `scenarioState` — the same four building blocks `gitea-selenium-cucumber` already has, following the same construction pattern.
- A login-via-API test proves the `clients` fixture works end to end: `AuthClient.loginViaApi` fetches real session cookies, they're injected into the browser context with Playwright's `context.addCookies`, and the app treats the session as authenticated.

### Out of scope

- Implementing `PlaywrightInteractionStrategy`'s real methods. It's still every method logging and returning a placeholder — deliberately, confirmed again in this change after the concrete blocker surfaced: `mainPage.hasExpectedElementsDisplayed()` needs `isVisible`/`findElement`/`getText`/`getAttribute` actually working, which they don't yet. This change stops at the fixtures; no UI-driven login test is added here; `strategy` and `pages` are wired and typecheck but nothing exercises them yet.
- Any change to `PlaywrightRequestStrategy` or `GiteaApiClient` themselves — both already complete from the prior change.
- `gitea-selenium-vitest`. It doesn't use `PageFactory` at all (its fixtures expose each page individually); untouched.

## Capabilities

No requirement text changes — this wires existing abstractions into a third test runner and relocates one class without changing what it does. `skip_specs: true`.

## Impact

New: `business-logic/common/ui/page.factory.ts`, `services/playwright-native/fixtures/credentials.ts`, `services/playwright-native/fixtures/fixture.ts`, `services/playwright-native/tests/login-api.spec.ts`. Removed: `services/gitea-selenium-cucumber/features/support/page.factory.ts`, `services/playwright-native/fixtures/pages.fixture.ts` (broken, unused boilerplate). Modified: `services/gitea-selenium-cucumber/features/support/hooks.ts`, `services/gitea-selenium-cucumber/features/support/world.ts`, `services/playwright-native/package.json`, `services/playwright-native/playwright.config.ts`.
