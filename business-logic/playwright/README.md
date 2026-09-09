# @gitea-automation/business-logic-playwright

**Not started.** Reserved package, sibling of [`@gitea-automation/business-logic-selenium`](../selenium/README.md), for whenever a Playwright-based project starts in this monorepo.

Today this folder only holds a `package.json` so `npm install`/`npm run typecheck --workspaces --if-present` at the repo root traverse it without doing anything.

When work starts here: it follows the same `ui/`+`api/` split `business-logic-selenium` already has. Concrete Gitea page objects built on Playwright's `Page`/`Locator` go in `ui/pages/` — the equivalent of `business-logic-selenium/ui/pages/`. The `api/` side is a separate question: `business-logic-selenium/api/entities/` is already tool-agnostic (pure data shapes) and might be reusable as-is in `api/entities/` here; `business-logic-selenium/api/clients/` extends `GiteaApiClient` from `@gitea-automation/core-selenium`, so this package's `api/clients/` would need its own client base (from `@gitea-automation/core-playwright`) even if the concrete endpoint logic ends up nearly identical. Not resolved in advance — decide when this work actually starts.
