# Proposal

## Why

Two of the four Vitest end-to-end cases exist only for Selenium: `AT-ISS-01`, the metadata lifecycle of an issue, and `AT-ISS-02`, scoped labels. Issue 104 splits the port by original authorship, and these two are this author's; `organizations` is covered by `playwright-organization-e2e`. Without them the week 3 comparison has no issue-side data to measure, since the comparable pair is `gitea-selenium-vitest` against `playwright-native`.

## What Changes

- Add `tests/issue-metadata.spec.ts` to `services/playwright-native`, replicating `gitea-selenium-vitest/tests/issue-metadata.test.ts` assertion by assertion: create an issue with a Markdown description, a label, a milestone and an assignee, confirm both list filters return it, and confirm closing it drives its milestone to 100 percent.
- Add `tests/scoped-labels.spec.ts`, replicating `gitea-selenium-vitest/tests/issues.test.ts`: create three scoped labels through the UI, confirm a label replaces the one of its own scope and coexists with another scope, and confirm removing it leaves the issue.
- Add `fixtures/issues-fixtures.ts` with the API-seeded state both cases start from: `repository`, `issue`, `maintainer`, `classificationLabel` and `milestone`. They are the Playwright form of the Vitest fixtures of the same names and reuse the clients the `clients` fixture already builds.
- Replace the string `filterByLabel` waits on with a regex in `business-logic/pages/issues/issue-list.page.ts`, so the two strategies agree on what it means.
- Document both specs and the fixture file in the `playwright-native` README.

Neither spec reaches the browser except through `pageObjects`. Where the Vitest tests navigate with `driver.get(page.getUrl(...))`, these call the page object's own `openFor(...)`, which also waits for that view's ready locators. Both call `sessionManager.loginAsOwner()` explicitly, because Playwright has no counterpart to the Vitest `loggedInSession` automatic fixture.

## Capabilities

No requirement text changes: two existing scenarios are ported to a runner that already has its fixture layer. `skip_specs: true`.

## Impact

New: `services/playwright-native/tests/issue-metadata.spec.ts`, `services/playwright-native/tests/scoped-labels.spec.ts`, `services/playwright-native/fixtures/issues-fixtures.ts`. Modified: `business-logic/pages/issues/issue-list.page.ts`, `services/playwright-native/README.md`.

## Out of Scope

- The `organizations` case, ported by `playwright-organization-e2e`.
- The comparison dataset itself, which is issue 109.
- Wiring these specs into the CT pipeline, which is issue 108 and waits on the strategy-pattern pull request.
- The two latent divergences found while reading `PlaywrightInteractionStrategy` that nothing here needs: `waitForUrl` still disagrees with Selenium for a plain string once no caller passes one, and `executeScript` forwards only its first argument. Both go to the issue tracker rather than to this change.
