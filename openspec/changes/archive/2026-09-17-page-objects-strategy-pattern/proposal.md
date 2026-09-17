## Why

`business-logic/common/ui/pages/**` (28 files) is 100% Selenium: every page/fragment extends `BasePage`/`BaseComponent` from `@gitea-automation/core-selenium/ui/base-pages/*`, builds locators with `selenium-webdriver`'s `By`, and several call `this.driver`/`WebElement` methods directly, bypassing the existing abstraction. Before any Playwright test can reuse these page objects, they need to stop being tied to one tool's types — a Strategy pattern lets one concrete page class serve either tool, with the technology chosen by whoever constructs the page, not by the page itself.

## What Changes

- New workspace `core/page-objects` (`@gitea-automation/core-page-objects`) defines `IInteractionStrategy` (the full interaction contract, locators as plain strings) and `IElementHandle` (what a found element looks like, replacing `WebElement`), plus `BaseComponent`/`BasePage` — the Context classes pages extend, holding an injected `IInteractionStrategy` and delegating every method to it.
- `SeleniumInteractionStrategy implements IInteractionStrategy` — a real port of today's `core/selenium/ui/base-pages/base-component.ts` logic (stale-element retry, per-session lookup dedup, drag handling, all preserved), plus four new methods (`queryAll`, `waitFor`, `waitForUrl`, `executeScript`) that close every direct `this.driver.*`/raw-`WebElement` escape hatch found across the 28 files.
- `PlaywrightInteractionStrategy implements IInteractionStrategy` — every method present, each body a `console.log` plus a type-satisfying placeholder return. **Not a working implementation** — that's explicitly future work.
- All 28 pages/fragments migrate: base-class import → `@gitea-automation/core-page-objects/...`, `By.css`/`By.id` locators → plain CSS-selector strings, constructors take an injected `strategy: IInteractionStrategy` instead of `driver: WebDriver`, every direct driver/`WebElement` call replaced by the new abstracted equivalent.
- `services/gitea-selenium-cucumber/features/support/page.factory.ts` and `services/gitea-selenium-vitest/src/fixtures/fixture.ts` construct pages via a new `createSeleniumStrategy(driver)` factory instead of passing the raw `WebDriver`, so the existing suites keep compiling and passing.
- `core/selenium/ui/base-pages/{base-component.ts,base.page.ts}` are retired once nothing imports them.

### Out of scope

- Making `PlaywrightInteractionStrategy` actually work. It stays `console.log` stubs this phase.
- Any real Playwright test or fixture wiring a page to a live `Page` object.
- `core-config`/entities/API clients — untouched, this is UI-interaction only.
- Fixing pre-existing quirks unrelated to the technology dependency itself (`create-repository.page.ts`'s `getUrl()` still throws "Method not implemented."; `organization.facade.ts` still never calls `super.open()`).

## Capabilities

No requirement text changes. `page-objects`' and `core-driver`'s existing requirements (how a component reports visibility, how it drags, how it serializes lookups per session) describe behavior that must hold identically after this refactor — the change relocates _where_ that behavior lives (from `core-selenium`'s base classes into a strategy behind an interface), it does not alter what a page object is contractually allowed or required to do. `.openspec.yaml` sets `skip_specs: true`.

## Impact

New: `core/page-objects/**`. Modified: all 28 files under `business-logic/common/ui/pages/**`, `services/gitea-selenium-cucumber/features/support/page.factory.ts`, `services/gitea-selenium-vitest/src/fixtures/fixture.ts`, `services/gitea-selenium-vitest/tests/organizations.test.ts`. Removed: `core/selenium/ui/base-pages/{base-component.ts,base.page.ts}`. No change to `core/selenium/ui/{drivers,utils}/**`, `business-logic/selenium/api/**`, or any `.gitea/workflows/`.
