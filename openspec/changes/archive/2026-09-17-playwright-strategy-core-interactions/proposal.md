## Why

`PlaywrightInteractionStrategy` has been a pure stub since it was scaffolded — every method logs and returns a placeholder. `playwright-native`'s `strategy`/`pages` fixtures exist but nothing exercises them yet. The four most basic interactions (find one element, find several, click, fill a field) are enough to write the first real UI-driven test.

## What Changes

- `PlaywrightInteractionStrategy.findElement`/`findElements`/`click`/`type` (and the matching `PlaywrightElementHandle.click`/`findElement`/`findElements`) become real implementations, built directly from Playwright's own documented API and idioms — not ported from the Selenium strategy or the page objects: `Locator` construction is lazy (no eager wait, matching how Playwright locators work), `click`/`fill` rely on Playwright's built-in actionability auto-waiting, `findElements` uses `Locator.all()` (Playwright's documented way to snapshot every match into a list).
- `services/playwright-native/tests/login-ui.spec.ts`: a UI-driven login test using these four methods directly (through the `strategy` fixture), since `LoginPage.login()` itself still composes `clickAndWaitForUrl`, which remains a stub. Verified through Playwright's own `page.waitForURL`/`expect`, same as the earlier login-via-API test.

### Out of scope

- Every other `IInteractionStrategy` method (`clearAndType`, drag-and-drop, `isVisible`, `getText`, `getAttribute`, the `*AndWait*` compositions, `open`, `waitFor`/`waitForUrl`, `executeScript`). Still stubs. `LoginPage.login()` isn't usable end to end yet because of this — the new test drives the strategy's primitives directly instead.
- Any change to `IInteractionStrategy`'s contract, `BaseComponent`/`BasePage`, or the Selenium strategy.

## Capabilities

No requirement text changes — fills in an already-specified interface's methods with real behavior. `skip_specs: true`.

## Impact

Modified: `core/page-objects/strategies/playwright-interaction.strategy.ts`. New: `services/playwright-native/tests/login-ui.spec.ts`.
