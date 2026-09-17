# @gitea-automation/core-playwright

**Not started.** Reserved package, sibling of [`@gitea-automation/core-selenium`](../selenium/README.md), for whenever a Playwright-based project starts in this monorepo (`services/playwright-native` or `services/playwright-bdd`).

Today this folder only holds a `package.json` so `npm install`/`npm run typecheck --workspaces --if-present` at the repo root traverse it without doing anything.

**In the meantime, the Playwright side of the Strategy pattern already exists — it just lives in [`@gitea-automation/core-page-objects`](../page-objects/README.md), not here.** `PlaywrightInteractionStrategy` implements the same `IInteractionStrategy` interface `SeleniumInteractionStrategy` does, but every method is a `console.log` stub — nothing here drives a real Playwright `Page` yet. When real Playwright work starts, either that strategy's internals get filled in where it already sits, or it (and its Selenium counterpart) move into `core-selenium`/`core-playwright` respectively, each package owning its own tool's concrete implementation behind the shared interface. Not resolved in advance — decide when this work actually starts.

A Playwright driver/context factory (the equivalent of `core-selenium/ui/drivers/driver.factory.ts`) would still go here regardless of where the strategy implementation ends up, since that's Playwright-specific setup with no Selenium equivalent to share.
