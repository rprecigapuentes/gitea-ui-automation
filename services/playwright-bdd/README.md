# playwright-bdd

**Not started.** Reserved workspace for a future UI automation project using Playwright with a BDD/Gherkin style (e.g. via [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) or Cucumber+Playwright), as part of the `gitea-ui-automation` monorepo.

Today this folder only holds a `package.json` so `npm install`/`npm run typecheck --workspaces --if-present` at the repo root can traverse it without doing anything.

When work starts here: this project can reuse `@gitea-automation/core/gitea/**` (Gitea API clients + entities — tool-agnostic) as-is. It cannot reuse `@gitea-automation/core/selenium/**` (built on `selenium-webdriver`'s `WebDriver`/`By`, incompatible with Playwright's `Page`/`Locator`) — the expected pattern is to add a parallel `core/playwright/` (drivers/config/base-pages built on Playwright's API) alongside `core/selenium/`, without touching it. See [`core/README.md`](../../core/README.md).
