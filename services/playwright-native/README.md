# playwright-native

**Not started.** Reserved workspace for a future UI automation project using Playwright's native test runner (`@playwright/test`), as part of the `gitea-ui-automation` monorepo.

Today this folder only holds a `package.json` so `npm install`/`npm run typecheck --workspaces --if-present` at the repo root can traverse it without doing anything.

When work starts here: this project can reuse `@gitea-automation/core/api/**` (Gitea API clients + entities — tool-agnostic) as-is. It cannot reuse `@gitea-automation/core/ui/**` (built on `selenium-webdriver`'s `WebDriver`/`By`, incompatible with Playwright's `Page`/`Locator`) — since `core/ui/` isn't namespaced by tool, how to add Playwright's own driver/base-pages alongside the existing Selenium ones is a decision to make when this work starts. See [`core/README.md`](../../core/README.md).
