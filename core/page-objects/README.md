# @gitea-automation/core-page-objects

> One page-object class, two tools. The Strategy pattern that lets the same `LoginPage` run on
> Selenium or on Playwright.

## Contents

- [How it fits together](#how-it-fits-together)
- [Structure](#structure)
- [How waiting works](#how-waiting-works)
- [Where the two strategies differ](#where-the-two-strategies-differ)
- [Drag and drop](#drag-and-drop)

## How it fits together

A page object extends `BasePage` or `BaseComponent` and only calls the methods it inherits
(`click`, `findElement`, `isVisible`, `clickAndWaitFor`, …), with locators written as plain CSS
strings. It never imports `selenium-webdriver` or `@playwright/test`, and it never decides which one
backs it: whoever builds the page does, through the factory.

```ts
import { InteractionStrategyFactory } from "@gitea-automation/core-page-objects/interaction-strategy.factory";

const strategy = usePlaywright
  ? InteractionStrategyFactory.playwright(page)
  : InteractionStrategyFactory.selenium(driver);

const loginPage = new LoginPage(strategy); // the same class either way
```

| Role in the pattern | Here                                                             |
| ------------------- | ---------------------------------------------------------------- |
| Strategy interface  | `IInteractionStrategy`                                           |
| Concrete strategies | `SeleniumInteractionStrategy`, `PlaywrightInteractionStrategy`   |
| Context             | `BaseComponent`, which holds a strategy and only delegates to it |
| Factory             | `InteractionStrategyFactory`, the one place a tool is chosen     |

## Structure

```
core/page-objects/
├── interaction-strategy.interface.ts   IInteractionStrategy: the contract every page calls
├── element-handle.interface.ts         IElementHandle: what findElement / findElements return
├── errors.ts                           InteractionInterceptedError: a click an overlay covered
├── base-component.ts                   BaseComponent: the Context, delegates to its strategy
├── base.page.ts                        BasePage: adds getUrl(), open() and getVolatileRegions()
├── interaction-strategy.factory.ts     InteractionStrategyFactory
└── strategies/
    ├── selenium-interaction.strategy.ts
    ├── playwright-interaction.strategy.ts
    └── utils/                          the HTML5 drag fallback, one per tool
```

## How waiting works

No page and no test ever writes a wait. Every action is paired with the condition that proves it
finished, and the strategy waits for that condition.

| Method                                 | Waits for                                                     |
| -------------------------------------- | ------------------------------------------------------------- |
| `findElement` / `findElements`         | the locator to resolve to visible elements                    |
| `actAndWaitFor(action, readyLocators)` | every ready locator, after the action                         |
| `clickAndWaitFor`, `typeAndWaitFor`    | the same, with the click or the typing built in               |
| `actAndWaitUntil(action, predicate)`   | a predicate, for state no locator expresses (a count, a text) |
| `clickAndWaitForUrl(locator, pattern)` | a navigation, when the click renders nothing new to wait for  |
| `open(readyLocators)`                  | the page to load, then what proves it rendered                |
| `waitUntil(predicate)`                 | a predicate, answering `false` on timeout instead of throwing |

**A timeout of `0` means "check once, now".** Both tools read `0` as "wait forever" natively, so both
strategies special-case it. That is how a page asks "is the banner gone?" without paying five
seconds for every no.

On Selenium, the session's implicit wait is set to `0` in `DriverFactory`, and every lookup polls
explicitly through `driver.wait`: it succeeds only when the elements exist **and** are displayed,
and it retries a stale reference or a Chrome node lost mid-render while rethrowing anything else.
Mixing an implicit wait with these explicit ones would make every absence check block for the full
implicit timeout.

## Where the two strategies differ

The page objects were written against the Selenium contract, so the Playwright strategy follows it
wherever the two disagree:

| Behaviour                      | Selenium                             | Playwright                                      |
| ------------------------------ | ------------------------------------ | ----------------------------------------------- |
| `findElement`                  | polls until one visible element      | returns a lazy locator; the wait happens on use |
| `type`                         | `sendKeys`, appends                  | `pressSequentially`, appends (not `fill`)       |
| `getText`                      | trimmed by the driver                | `textContent`, trimmed to match                 |
| `getAttribute("value")`        | the live property                    | `inputValue`, the live value                    |
| A click under an overlay       | throws `InteractionInterceptedError` | waits until the overlay is gone                 |
| `root` (scoping to an element) | every method                         | reads and `click`; `type` addresses the page    |

`waitFor` and `waitUntil` poll a plain predicate rather than using `expect.poll`, so pages stay
usable outside a test's assertion context.

## Drag and drop

`dragAndDrop` moves a real pointer step by step, because Gitea's board reacts to a gradual pointer
path rather than to the HTML5 events `Locator.dragTo()` dispatches. Firefox moves the pointer but
never emits the drop, so `dispatchDragEvents` dispatches the native `dragstart` … `drop` sequence by
hand. `ProjectBoardPage.moveCard` tries the gesture first and falls back only when a reloaded board
shows the card did not move, so neither the page nor the strategy needs to know which browser it is.
