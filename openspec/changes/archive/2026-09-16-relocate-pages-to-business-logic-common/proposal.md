## Why

`business-logic/selenium/ui/pages/**` held every Gitea page object, but the package name says "selenium" and the pages import `selenium-webdriver` types directly — nothing about their location signals that they're meant to outlive any one tool. Moving them out to their own workspace is the first concrete step toward page objects a Playwright project could eventually share, without waiting for the larger technology-agnostic rewrite to land all at once.

## What Changes

- New workspace `business-logic/common` (`@gitea-automation/business-logic-common`) holds what used to be `business-logic/selenium/ui/pages/**`, moved as-is — same files, same `selenium-webdriver`/`core-selenium` imports. This is a relocation, not the rewrite: the pages are not yet technology-agnostic, only differently homed.
- Five moved files whose relative imports reached into `business-logic/selenium/api/entities/**` (crossing what is now a package boundary) import from `@gitea-automation/business-logic-selenium/api/entities/...` instead, the same way every external consumer already did.
- `services/gitea-selenium-cucumber/features/support/page.factory.ts`, `services/gitea-selenium-vitest/src/fixtures/fixture.ts` and `services/gitea-selenium-vitest/tests/organizations.test.ts` import pages from `business-logic-common` instead of `business-logic-selenium`.
- Both services declare `@gitea-automation/business-logic-common` as a dependency; `gitea-selenium-vitest`'s `vitest.config.ts` adds it to `server.deps.inline` alongside `business-logic-selenium`.
- `business-logic/selenium/package.json` drops its now-dead `"./ui/*"` export; the emptied `ui/` directory is gone.

### Out of scope

- Making the pages themselves technology-agnostic. They still import `selenium-webdriver` and `@gitea-automation/core-selenium` directly, so `playwright-native`/`playwright-bdd` still cannot use them — that's the rewrite this relocation sets up for, not this change.
- `core-playwright` / `business-logic-playwright`: still reserved and empty.
- Updating documentation. `business-logic/README.md`, `business-logic/selenium/README.md`, the root `README.md`, and four service READMEs still describe pages as living inside `business-logic/selenium` — left as-is pending a decision on how to frame the in-progress reorg.

## Capabilities

No requirement of the automation framework changes — `page-objects`' requirements (e.g. how `isVisible` behaves) describe component behavior, not where the files live. `.openspec.yaml` sets `skip_specs: true`.

## Impact

`business-logic/common/**` (new), `business-logic/selenium/package.json`, `business-logic/selenium/ui/**` (removed), `services/gitea-selenium-cucumber/features/support/page.factory.ts`, `services/gitea-selenium-cucumber/package.json`, `services/gitea-selenium-vitest/{package.json,vitest.config.ts,src/fixtures/fixture.ts,tests/organizations.test.ts}`, root `package-lock.json`.
