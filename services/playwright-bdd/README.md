# playwright-bdd

**Not started.** Reserved workspace for a future UI automation project using Playwright with a BDD/Gherkin style (e.g. via [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) or Cucumber+Playwright), as part of the `gitea-ui-automation` monorepo.

Today this folder only holds a `package.json` so `npm install`/`npm run typecheck --workspaces --if-present` at the repo root can traverse it without doing anything.

When work starts here: this project can reuse `@gitea-automation/business-logic-selenium/api/entities/**` (Gitea entities — tool-agnostic; the clients extend `GiteaApiClient` from `core-selenium`, so a Playwright client layer would need its own base, likely in `@gitea-automation/core-playwright`) as a reference. It cannot reuse `@gitea-automation/core-selenium/**` or `@gitea-automation/business-logic-selenium/ui/pages/**` (built on `selenium-webdriver`'s `WebDriver`/`By`, incompatible with Playwright's `Page`/`Locator`). The reserved packages for this are already scaffolded: [`core/playwright`](../../core/playwright/README.md) (empty, sibling of `core/selenium`) and [`business-logic/playwright`](../../business-logic/playwright/README.md) (empty, sibling of `business-logic/selenium`) — that's where this project's driver/base-pages and page objects/clients go when work starts.
