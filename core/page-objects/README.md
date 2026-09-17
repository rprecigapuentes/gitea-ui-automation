# @gitea-automation/core-page-objects

The Strategy pattern that lets one page-object class run against either Selenium or Playwright: the shared interfaces, the two Context classes every page object extends, and both tools' concrete strategies (one real, one a stub).

## Why this package, and why it isn't split by tool

Every other package under `core/` is split by tool (`core/selenium/` vs. `core/playwright/`) so a file with a real dependency on one tool's types never sits in a folder that's supposed to be tool-agnostic. This package is the deliberate exception: its whole purpose is to hold code that talks to _both_ tools behind one interface, so a page object never has to import either tool directly. Splitting it by tool would defeat the point — a page needs `BaseComponent`/`IInteractionStrategy` from one shared place, not from "the Selenium one" or "the Playwright one."

## Structure

```
core/page-objects/
├── interaction-strategy.interface.ts   # IInteractionStrategy — the full contract, locators as plain CSS-selector strings
├── element-handle.interface.ts         # IElementHandle — what findElement/findElements return, replacing a raw WebElement
├── errors.ts                           # InteractionInterceptedError — e.g. a click blocked by a transitioning overlay, tool-agnostic
├── base-component.ts                   # BaseComponent — the Context: holds an injected IInteractionStrategy, delegates every method to it
├── base.page.ts                        # BasePage extends BaseComponent — adds getUrl()/open(), the Navigable contract
├── selenium-interaction.strategy.ts    # SeleniumInteractionStrategy — real implementation, ported from core-selenium's former base-component.ts
└── playwright-interaction.strategy.ts  # PlaywrightInteractionStrategy — stub: every method logs and returns a placeholder, never throws
```

## The pattern

A page object (in `@gitea-automation/business-logic-common`) extends `BaseComponent`/`BasePage` and only ever calls its inherited methods (`click`, `findElement`, `isVisible`, …) with plain CSS-selector-string locators. It never imports `selenium-webdriver` or `@playwright/test`, and never decides which one backs it — that choice is made by whoever constructs the page:

```ts
import { createSeleniumStrategy } from "@gitea-automation/core-page-objects/selenium-interaction.strategy";
import { createPlaywrightStrategy } from "@gitea-automation/core-page-objects/playwright-interaction.strategy";

const strategy = usePlaywright ? createPlaywrightStrategy(page) : createSeleniumStrategy(driver);
const loginPage = new LoginPage(strategy); // same LoginPage class either way
```

`BaseComponent` is the Context in the classic Strategy-pattern sense: it holds whatever `IInteractionStrategy` it was constructed with and only delegates to it, never branches on which one it has.

## What closes the gap beyond the obvious `find`/`click`/`type`

`IInteractionStrategy` has four methods beyond what `core-selenium`'s old `BaseComponent` exposed, added because several pages used to reach past it and call `WebDriver`/`WebElement` methods directly:

- **`queryAll(locator)`** — a raw, unwaited, top-level query (empty array on no match, never throws), for the row/list-reading pattern that used to call `driver.findElements(locator)` directly.
- **`waitFor(predicate, timeoutMs, message?)`** — a generic predicate wait with a custom timeout message, for the custom polling loops that used to call `driver.wait(predicate, ms, "message")` directly.
- **`waitForUrl(pattern, timeoutMs?, message?)`** — waits for the current URL to match/contain `pattern`; `clickAndWaitForUrl` composes this instead of duplicating URL-wait logic.
- **`executeScript(script, ...args)`** — runs a real function in the browser, for the one page that needed to read a Fomantic UI modal's live DOM state directly.

## Current limitation

`PlaywrightInteractionStrategy` is not a working implementation. Every method logs its call and returns a type-satisfying placeholder (`""`, `false`, `[]`, `undefined`, …), so any page object typechecks and runs without throwing when constructed with it — which is what proves a page has no remaining Selenium dependency — but nothing here drives a real Playwright browser yet. That's separate, not-yet-started work.

## Dependencies

`@gitea-automation/core-logger`, `@gitea-automation/core-selenium` (only for `ui/utils/html5-drag.util.ts`, used by the Selenium strategy's drag fallback), `selenium-webdriver`, `@playwright/test` (for the `Page`/`Locator` types the Playwright strategy's constructor and `IElementHandle` implementation reference, even though its bodies are stubs).
