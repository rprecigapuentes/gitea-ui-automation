# @gitea-automation/core-playwright

**Not started.** Reserved package, sibling of [`@gitea-automation/core-selenium`](../selenium/README.md), for whenever a Playwright-based project starts in this monorepo (`services/playwright-native` or `services/playwright-bdd`).

Today this folder only holds a `package.json` so `npm install`/`npm run typecheck --workspaces --if-present` at the repo root traverse it without doing anything.

When work starts here: this is where a Playwright driver/context factory and base page/component classes go — the equivalent of `core-selenium/ui/drivers` and `core-selenium/ui/base-pages`, but built on Playwright's `Page`/`Locator` API instead of `selenium-webdriver`'s `WebDriver`/`By`. The two are incompatible APIs, so nothing here can be shared with `core-selenium` — this package exists specifically so Playwright's framework code has its own home instead of being bolted onto the Selenium one.
