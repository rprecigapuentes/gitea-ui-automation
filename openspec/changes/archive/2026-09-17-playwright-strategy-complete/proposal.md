## Why

`PlaywrightInteractionStrategy` had 4 of `IInteractionStrategy`'s ~24 methods real; everything else logged and returned a placeholder. The condition for this change: every method must satisfy what the current page objects actually call it for, so that replicating any existing Selenium-driven test against Playwright works without touching a single page object — any technology-specific adjustment belongs in a test, not in `business-logic/pages`.

## What Changes

Every remaining `IInteractionStrategy` method, and the four still-stubbed `IElementHandle` methods (`isSelected`, `isDisplayed`, `clear`, `sendKeys` — confirmed in real use directly on handles, e.g. `checkbox.isSelected()`, `input.clear()`/`input.sendKeys(...)`), now call a real Playwright API:

- `clearAndType` — `Locator.fill()`. Fill already replaces the field's value; the extra `Locator.clear()` a review comment had added was redundant and dropped.
- `dragAndDrop` — `Locator.dragTo()`, Playwright's own drag primitive.
- `dispatchDragEvents` — delegates to `dragAndDrop`. Its Selenium counterpart existed only to route around a geckodriver bug (`#1450`) that doesn't exist in Playwright's own Firefox automation, so there's nothing for a second implementation to do differently.
- `getCurrentUrl` — `page.url()`.
- `reload` — `page.reload()`, then `Locator.waitFor()` per ready locator.
- `queryAll` — `Locator.all()`, Playwright's documented way to snapshot every match immediately, no wait.
- `waitFor`/`waitUntil`/`actAndWaitUntil` — `expect.poll(predicate, { timeout, message })`, Playwright's own documented tool for waiting on an arbitrary async condition. `waitUntil` reports `false` instead of throwing on timeout (`.catch(() => false)`), matching its "never throws" contract.
- `clickAndWaitUntil`/`clickAndWaitFor`/`typeAndWaitFor` — each composes the primitive already implemented (`click`/`type` + `actAndWaitUntil`/`actAndWaitFor`), the same composition shape the interface's other methods already use.
- `actAndWaitFor` — runs the action, then `Locator.waitFor()`s each ready locator before wrapping it as a handle.
- `waitForUrl` — `page.waitForURL()`.
- `executeScript` — `page.evaluate(script, args[0])`. Every current call site passes exactly one argument; `page.evaluate` takes the function and one serializable argument, not a variadic list, so this is the direct mapping for how the interface is actually used today.
- `IElementHandle.isSelected`/`isDisplayed`/`clear`/`sendKeys` — `Locator.isChecked()`, `Locator.isVisible()`, `Locator.clear()`, `Locator.fill()`.

### Out of scope

- Porting additional Selenium-only test scenarios to `playwright-native` to exercise these methods end to end. The existing suite (login via API, login via UI) stays green; broader coverage is a separate, later stage.
- Any change to a page object. None was touched or needed to be.

## Capabilities

No requirement text changes — fills in an already-specified interface with real behavior. `skip_specs: true`.

## Impact

Modified: `core/page-objects/strategies/playwright-interaction.strategy.ts` only.
