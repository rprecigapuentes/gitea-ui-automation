# playwright-bdd

**Not started.** Reserved workspace for a future UI automation project using Playwright with a BDD/Gherkin style (e.g. via [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) or Cucumber+Playwright), as part of the `gitea-ui-automation` monorepo.

Today this folder only holds a `package.json` so `npm install`/`npm run typecheck --workspaces --if-present` at the repo root can traverse it without doing anything.

When work starts here: the concrete page objects (`LoginPage`, `IssuePage`, `OrganizationFacade`, every fragment — real Gitea selectors) are reusable as-is: they live in [`@gitea-automation/business-logic`](../../business-logic/README.md), built on [`@gitea-automation/core-page-objects`](../../core/page-objects/README.md)'s Strategy pattern rather than directly on `selenium-webdriver`, so the same classes the Selenium services use would work here too, constructed with `InteractionStrategyFactory.playwright(page)` instead of `InteractionStrategyFactory.selenium(driver)`. The catch: `PlaywrightInteractionStrategy` is currently a stub (every method logs and returns a placeholder, nothing drives a real browser yet) — making it real is the remaining work before a Gitea test could run in either this service or `playwright-native`. `@gitea-automation/business-logic/entities/**` (Gitea entities, tool-agnostic) is reusable as-is for API-side seeding.
