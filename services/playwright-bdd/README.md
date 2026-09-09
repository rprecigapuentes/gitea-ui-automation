# playwright-bdd

**Not started.** Reserved workspace for a future UI automation project using Playwright with a BDD/Gherkin style (e.g. via [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) or Cucumber+Playwright), as part of the `gitea-ui-automation` monorepo.

Today this folder only holds a `package.json` so `npm install`/`npm run typecheck --workspaces --if-present` at the repo root can traverse it without doing anything.

When work starts here: this project can reuse `@gitea-automation/business-logic/api/**` (Gitea API clients + entities — tool-agnostic) as-is. It cannot reuse `@gitea-automation/core/ui/**` or `@gitea-automation/business-logic/ui/**` (both built on `selenium-webdriver`'s `WebDriver`/`By`, incompatible with Playwright's `Page`/`Locator`) — since neither is namespaced by tool, how to add Playwright's own driver/base-pages/page-objects alongside the existing Selenium ones is a decision to make when this work starts. See [`core/README.md`](../../core/README.md) and [`business-logic/README.md`](../../business-logic/README.md).
