## Why

`login-ui.spec.ts` was rewritten to drive the login test through `pageObjects.loginPage.open()`/`.login()` and assert through `pageObjects.mainPage.hasExpectedElementsDisplayed()`/`navBar.getCurrentOrganization()` — the same way the Selenium suites already do — instead of calling the strategy's primitives directly. That path needs `open`, `clickAndWaitForUrl`, `isVisible`, `getText`, and `getAttribute` to be real; all five were still stubs.

## What Changes

- `PlaywrightInteractionStrategy.open` — `page.goto(url)` then waits for each ready locator (`Locator.waitFor()`).
- `PlaywrightInteractionStrategy.clickAndWaitForUrl` — `Promise.all([page.waitForURL(pattern), this.click(...)])`.
- `PlaywrightInteractionStrategy.isVisible` — `Locator.waitFor({ state: "visible" })` per locator, `.catch(() => false)`, AND across the list.
- `PlaywrightInteractionStrategy.getText`/`getAttribute` — `Locator.textContent()`/`Locator.getAttribute()` on the page-rooted path; delegate to `root.findElement(locator)` then the handle's own method on the root-scoped path (which required implementing `toElementHandle`'s `getText`/`getAttribute` for real too, previously stubs).
- Fixed a real, pre-existing bug this surfaced: `MainPage`'s `organizationOption` locator carried a redundant `#dashboard-repo-list` prefix that `repositoryOption` (correctly relative) didn't. Selenium's `WebElement`-relative CSS lookup tolerates a redundant self-referential prefix; Playwright's `Locator.locator()` chaining does not, and the read hung until timeout. Removed the redundant prefix — verified this doesn't change anything for the Selenium suites (still green).

### Out of scope

- Every other still-stubbed `IInteractionStrategy` method (`clearAndType`, drag-and-drop, the remaining `*AndWait*` compositions, `waitFor`/`waitForUrl` as standalone methods, `executeScript`). `waitForUrl` specifically stays a stub — `clickAndWaitForUrl` calls `page.waitForURL` directly rather than composing through it, since nothing needs `waitForUrl` on its own yet.
- `isSelected`/`isDisplayed`/`clear`/`sendKeys` on the Playwright element handle — not needed by this login flow.

## Capabilities

No requirement text changes — fills in already-specified interface methods, plus one locator bugfix. `skip_specs: true`.

## Impact

Modified: `core/page-objects/strategies/playwright-interaction.strategy.ts`, `business-logic/pages/common/main.page.ts`.
