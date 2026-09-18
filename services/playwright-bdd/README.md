# playwright-bdd

**Not started.** Reserved workspace for a future UI automation project using Playwright with a BDD/Gherkin style (e.g. via [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) or Cucumber+Playwright), as part of the `gitea-ui-automation` monorepo.

Today this folder only holds a `package.json` so `npm install`/`npm run typecheck --workspaces --if-present` at the repo root can traverse it without doing anything.

When work starts here: the concrete page objects (`LoginPage`, `IssuePage`, `OrganizationFacade`, every fragment — real Gitea selectors) are reusable as-is: they live in [`@gitea-automation/business-logic`](../../business-logic/README.md), built on [`@gitea-automation/core-page-objects`](../../core/page-objects/README.md)'s Strategy pattern rather than directly on `selenium-webdriver`, so the same classes the Selenium services use would work here too, constructed with `InteractionStrategyFactory.playwright(page)` instead of `InteractionStrategyFactory.selenium(driver)`. `PlaywrightInteractionStrategy` is now fully implemented, so any existing Selenium-driven test scenario could be replicated here without touching a page object — the remaining work is writing the BDD/Gherkin layer itself. `@gitea-automation/business-logic/entities/**` (Gitea entities, tool-agnostic) is reusable as-is for API-side seeding.
