## Why

The `organizations.feature` scenario creates an organization through the UI but nothing deletes it afterward, so every run leaves a leftover organization on the Gitea instance. The existing `@project-board` tagged hooks already solve this for their own data, but that org-deletion logic can't just be copied again without duplicating it — and there's no way today to run only the scenarios under one tag, which is what motivated adding tags to `organizations.feature` in the first place.

## What Changes

- `organizations.feature`'s stray `@project-board` tag (copy-paste leftover, trailing space) is removed, leaving only `@organizations` — it doesn't need `@project-board`'s repositories/issues.
- `hooks.ts`'s org-deletion logic, duplicated between the `@project-board` and `@organizations` `After` hooks, is extracted into one shared helper both call. `@project-board`'s repository-deletion loop gets its own `try/catch`, separate from the org-deletion attempt after it, so a repo-deletion failure no longer silently skips that attempt.
- `cucumber.mjs` reads `tags: process.env.CUCUMBER_TAGS` (the config-file form of cucumber-js's `--tags`). `package.json` gets two scripts per existing tag (`test:organizations`, `test:organizations:parallel`, same pair for `test:project-board`), each wrapping an existing script with that env var — no per-tag-per-browser duplication, since `test:*:parallel` already fans out via `concurrently`, which inherits the parent env.
- **BREAKING** (type-level only): `fixture.ts`'s `OrganizationDashboardPage` construction moves to its current one-argument constructor, fixing a `typecheck` failure left over from an unrelated page-object edit. Nothing calls the fixture this feeds today, so nothing observable changes.

### Out of scope

- Changing anything about how or when `scenarioState.organization` is set. Cucumber's `After` hooks already run regardless of a step's outcome — the same guarantee Vitest's fixture teardown relies on — so no assertion-style change (soft or otherwise) is needed for cleanup to be reliable.
- The unfinished `cucumber-project-board-smokes` change (tasks 3.2, 4.2, 5.1) — untouched, unrelated to this one.
- Any new page object or locator. The scenario's UI flow is unchanged.

## Capabilities

### New Capabilities

- `cucumber-scenario-tagging`: what a Cucumber tag guarantees about the data a tagged scenario creates (torn down after the scenario, regardless of outcome) and how a tag can be used to select which scenarios a run executes.

### Modified Capabilities

None. `page-objects` and `pipeline` are unaffected — this covers the Cucumber service's own in-suite tagging, not page-object contracts or the CI workflow's service-level suite selection.

## Impact

`services/gitea-selenium-cucumber/features/support/hooks.ts`, `cucumber.mjs`, `package.json`; `services/gitea-selenium-cucumber/features/scenarios/organizations.feature`; `services/gitea-selenium-vitest/src/fixtures/fixture.ts`. No dependency or driver change.
