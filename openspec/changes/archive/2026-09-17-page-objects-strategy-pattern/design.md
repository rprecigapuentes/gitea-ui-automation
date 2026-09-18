## Context

See proposal.md - Why. Three facts from a full 28-file inventory shape this design:

Only two `By` factories are used anywhere in scope: `By.css` (203 sites) and `By.id` (6 sites, all trivially CSS-equivalent, e.g. `#user_name`). No xpath/name/className. A plain CSS-selector string covers every existing locator with no tagging scheme needed.

Several pages already bypass `BaseComponent` and call `this.driver.findElements`, `this.driver.wait` (with a custom predicate/message), `this.driver.wait(until.urlMatches(...))`, and `this.driver.executeScript` directly, plus call raw `WebElement` methods (`.click()`, `.getAttribute()`, `.isSelected()`, etc.) on elements returned by `findElement`/`findElements`. Any of these left unclosed would mean "the pages don't depend on Selenium" is false in practice even after the rest of the refactor.

Nothing in the 28 files branches on browser type — every fragment/page constructed mid-method (`ProjectColumnFragment.byTitle(this.driver, ...)`, `new LabelChipFragment(this.driver, root)`) just forwards whatever driver reference it already holds. There is no "detect and choose" logic anywhere to preserve or replace.

## Goals / Non-Goals

**Goals:**

- One concrete class per page, technology-blind: it calls interface methods only, never `selenium-webdriver` or `@playwright/test` types.
- Every documented behavior of today's `BaseComponent` (stale-element retry, per-session lookup dedup, drag re-resolution, `queryAll`'s no-wait/no-throw semantics) survives the move into `SeleniumInteractionStrategy` unchanged.
- A page instantiated with `PlaywrightInteractionStrategy` typechecks and runs without throwing, proving the "no Selenium dependency" claim mechanically rather than by inspection.

**Non-Goals:**

- A working Playwright implementation. Every `PlaywrightInteractionStrategy` method is a `console.log` stub this phase.
- Deciding where the concrete strategies eventually live long-term (they could later move into `core-selenium`/`core-playwright` respectively once those packages start real work) — `core/page-objects` is where the user already started, and stays their home for now.
- Any change to `business-logic/selenium/api/**` (clients, entities) or the drag-event util in `core/selenium/ui/utils/`.

## Decisions

**Strategy selection is constructor injection, not something `BaseComponent` decides internally.** `BaseComponent` receives an already-chosen `IInteractionStrategy` and only delegates; a small factory (`createSeleniumStrategy(driver)`, later `createPlaywrightStrategy(page)`) is what whoever constructs a page (`page.factory.ts`, `fixture.ts`) calls. This matches the GoF Strategy pattern's own division of responsibility (the Context holds a strategy, the client chooses it) and matches how every one of the 28 files already forwards a driver reference today with zero branching logic to preserve.

**Four new interface methods close the escape hatches, rather than special-casing them per page:** `queryAll` (raw, unwaited, top-level — replaces bare `this.driver.findElements`), `waitFor` (generic predicate+message — replaces bare `this.driver.wait(predicate, ms, "msg")`), `waitForUrl` (replaces `this.driver.wait(until.urlMatches/urlContains(...))`; `clickAndWaitForUrl` now composes it instead of duplicating URL-wait logic), `executeScript<T>` (replaces the one raw `this.driver.executeScript` call, now taking a real function instead of a JS string).

**`IElementHandle` wraps `WebElement` (Selenium) or a `Locator` (Playwright, later) with the same shape** (`click`, `getText`, `getAttribute`, `isSelected`, `isDisplayed`, `clear`, `sendKeys`, plus scoped `findElement`/`findElements`) — this is what lets `label-list.page.ts`'s `readRow` keep reading six attributes off one held element without re-querying the DOM each time, and what `LabelChipFragment`'s `root: WebElement` parameter becomes.

**`SeleniumInteractionStrategy.findElements` must wrap raw `WebElement`s into `IElementHandle` only after its retry loop, never inside it.** The loop's `catch` matches `seleniumError.StaleElementReferenceError` and a Chrome-specific "unhandled inspector error" string to decide whether to retry. A handle method throwing instead of the raw `WebElement` API would risk that `instanceof` check silently no longer matching, turning a today-retried transient failure into a hard failure.

**Migration is one commit per page-folder (plus its `page.factory.ts`/`fixture.ts` lines), not all-pages-then-consumers.** Both consumer files construct all 28 classes in one file each; the moment one page's constructor shape changes, its specific getter/fixture line breaks in the same commit that changed it. Splitting any other way leaves the tree non-compiling between commits.

## Risks / Trade-offs

- **Wrapping elements too early breaks stale-element retry** (see Decisions) → mitigated by keeping the retry loop entirely on raw `WebElement[]`, wrapping only the returned result.
- **`lookupTails`'s per-session dedup (for the healing proxy) must stay keyed on the raw `WebDriver`** inside `SeleniumInteractionStrategy`, not per-strategy-instance or per-handle → ported verbatim, not reimplemented.
- **`executeScript`'s signature changes from "pass a JS string" to "pass a function"** for the one Fomantic-modal check in `label-list.page.ts` — a real code change, not just a type change, called out explicitly in that migration commit for close review.
- **`queryAll` must not add a wait or visibility filter** — `isRemoveTeamMemberModalHidden` and similar callers depend on a stale/absent element reading as "not found," not as a thrown timeout.
- **Dropping to `console.log` stubs for Playwright means nothing here is runnable against a real Playwright browser yet** — accepted, it's explicitly out of scope; the acceptance bar is "typechecks and doesn't throw," not "passes a Playwright test."
