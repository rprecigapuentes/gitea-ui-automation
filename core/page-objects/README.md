# @gitea-automation/core-page-objects

The Strategy pattern that lets one page-object class run against either Selenium or Playwright: the shared interfaces, the two Context classes every page object extends, both tools' concrete strategies (both real), and the Factory that picks between them.

## Why this package, and why it isn't split by tool

Every other package under `core/` is split by tool (`core/selenium/` vs. a Playwright equivalent) so a file with a real dependency on one tool's types never sits in a folder that's supposed to be tool-agnostic. This package is the deliberate exception: its whole purpose is to hold code that talks to _both_ tools behind one interface, so a page object never has to import either tool directly. Splitting it by tool would defeat the point — a page needs `BaseComponent`/`IInteractionStrategy` from one shared place, not from "the Selenium one" or "the Playwright one." The two concrete strategies still live apart from the shared abstraction, in their own `strategies/` subfolder, since they _are_ tool-specific — only the interface, the Context classes, and the Factory that constructs a strategy stay at the top level.

## Structure

```
core/page-objects/
├── interaction-strategy.interface.ts   # IInteractionStrategy — the full contract, locators as plain CSS-selector strings
├── element-handle.interface.ts         # IElementHandle — what findElement/findElements return, replacing a raw WebElement
├── errors.ts                           # InteractionInterceptedError — e.g. a click blocked by a transitioning overlay, tool-agnostic
├── base-component.ts                   # BaseComponent — the Context: holds an injected IInteractionStrategy, delegates every method to it
├── base.page.ts                        # BasePage extends BaseComponent — adds getUrl()/open(), the Navigable contract
├── interaction-strategy.factory.ts     # InteractionStrategyFactory — the one place that picks a concrete strategy
└── strategies/
    ├── selenium-interaction.strategy.ts    # SeleniumInteractionStrategy — real implementation, ported from core-selenium's former base-component.ts
    ├── playwright-interaction.strategy.ts  # PlaywrightInteractionStrategy — real implementation, every method a direct Playwright API call
    └── utils/
        ├── selenium-html5-drag.util.ts     # simulateHtml5Drag — Selenium's dispatchDragEvents fallback (moved from core-selenium/utils/)
        └── playwright-html5-drag.util.ts   # simulateHtml5Drag — Playwright's dispatchDragEvents fallback
```

## The pattern

A page object (in `@gitea-automation/business-logic`) extends `BaseComponent`/`BasePage` and only ever calls its inherited methods (`click`, `findElement`, `isVisible`, …) with plain CSS-selector-string locators. It never imports `selenium-webdriver` or `@playwright/test`, and never decides which one backs it — that choice is made by whoever constructs the page, through the Factory:

```ts
import { InteractionStrategyFactory } from "@gitea-automation/core-page-objects/interaction-strategy.factory";

const strategy = usePlaywright
  ? InteractionStrategyFactory.playwright(page)
  : InteractionStrategyFactory.selenium(driver);
const loginPage = new LoginPage(strategy); // same LoginPage class either way
```

`BaseComponent` is the Context in the classic Strategy-pattern sense: it holds whatever `IInteractionStrategy` it was constructed with and only delegates to it, never branches on which one it has. `InteractionStrategyFactory` is the only public way to construct either concrete strategy — each of its two static methods is a one-line delegate to `new SeleniumInteractionStrategy(driver)`/`new PlaywrightInteractionStrategy(page)`.

## What closes the gap beyond the obvious `find`/`click`/`type`

`IInteractionStrategy` has four methods beyond what `core-selenium`'s old `BaseComponent` exposed, added because several pages used to reach past it and call `WebDriver`/`WebElement` methods directly:

- **`queryAll(locator)`** — a raw, unwaited, top-level query (empty array on no match, never throws), for the row/list-reading pattern that used to call `driver.findElements(locator)` directly.
- **`waitFor(predicate, timeoutMs, message?)`** — a generic predicate wait with a custom timeout message, for the custom polling loops that used to call `driver.wait(predicate, ms, "message")` directly.
- **`waitForUrl(pattern, timeoutMs?, message?)`** — waits for the current URL to match/contain `pattern`; `clickAndWaitForUrl` composes this instead of duplicating URL-wait logic.
- **`executeScript(script, ...args)`** — runs a real function in the browser, for the one page that needed to read a Fomantic UI modal's live DOM state directly.

## Playwright strategy notes

`PlaywrightInteractionStrategy` maps every `IInteractionStrategy`/`IElementHandle` method to a direct Playwright API call, e.g. `type`/`clearAndType` → `Locator.fill` (fill already clears the field, so no separate `Locator.clear()` call), and `queryAll` → `Locator.all`. `waitFor`/`waitUntil`/`actAndWaitUntil` poll the predicate on a plain interval instead of `@playwright/test`'s `expect.poll` — `expect` is a test-assertion primitive, and pages (and everything built on them) must stay usable outside a test's `expect` context, the same reason the Selenium strategy drives its own waits through `driver.wait()` rather than an assertion library. No method holds a `try`/`catch`; the strategy has no reason to intercept a Playwright error and translate it, unlike the Selenium strategy's `resolveRoot()`.

`isVisible`'s `timeoutMs` special-cases `0`: several fragments pass it meaning "check right now, don't wait" (the same intent Selenium's strategy documents for its own `timeoutMs === 0` case), but Playwright's own `Locator.waitFor({ timeout: 0 })` means the opposite — no timeout, wait forever. That case calls `Locator.isVisible()` instead, Playwright's actual no-wait check.

`dragAndDrop` moves the mouse by hand (`page.mouse.move` with `steps`, then `down`/`up`) rather than `Locator.dragTo()`: Gitea's Kanban board only reacts to a real, gradual pointer path, not the native HTML5 `DragEvent`s `dragTo()` dispatches instead. This lands reliably on chrome and edge, but under Firefox the automation protocol moves the pointer without the board ever registering a drop — the same category of limitation the Selenium strategy already documents for geckodriver (see `dispatchDragEvents`'s comment in `selenium-interaction.strategy.ts`). `dispatchDragEvents` is the real fallback for that case: [`strategies/utils/playwright-html5-drag.util.ts`](strategies/utils/playwright-html5-drag.util.ts)'s `simulateHtml5Drag` dispatches the native `pointerdown`/`dragstart`/`dragenter`/`dragover`/`drop`/`dragend` sequence by hand via `page.evaluate`, ported to Playwright's element-handle-in-`evaluate` mechanism instead of `executeAsyncScript`. `ProjectBoardPage.moveCard` (unmodified) already tries `dragAndDrop` first and only calls `dispatchDragEvents` if the drop didn't reach the server, so this fallback is exercised automatically, on whichever browser needs it, without either strategy or any page object knowing which one that is.

Both strategies' drag-event-dispatch fallbacks now live side by side in `strategies/utils/`: `playwright-html5-drag.util.ts` next to `selenium-html5-drag.util.ts`, which moved here from `core-selenium/utils/` — the only thing that ever imported it was `SeleniumInteractionStrategy`, already in this package, so there was no reason for it to live in a different one.

## Dependencies

`@gitea-automation/core-logger`, `selenium-webdriver`, `@playwright/test` (`Page`/`Locator` types and APIs the Playwright strategy and `IElementHandle` implementation use directly).
