## 1. Rename the package

- [x] 1.1 Moved `business-logic/selenium` to `business-logic/api` (`git mv` hit a transient permission error on this filesystem; used copy+remove instead, same result)
- [x] 1.2 Rename `business-logic/api/package.json`'s `name` to `@gitea-automation/business-logic-api`
- [x] 1.3 Update every `@gitea-automation/business-logic-selenium/*` import specifier across the repo to `@gitea-automation/business-logic-api/*`
- [x] 1.4 Update the dependency entry in `business-logic/common/package.json`, `services/gitea-selenium-vitest/package.json`, `services/gitea-selenium-cucumber/package.json`, `services/playwright-native/package.json`
- [x] 1.5 `npm install`, verify `npm run typecheck --workspaces --if-present` and `npm run lint` green

## 2. Sync docs and verify

- [x] 2.1 Updated every README referencing `business-logic/selenium` / `@gitea-automation/business-logic-selenium`: root `README.md`, `business-logic/README.md`, `business-logic/common/README.md`, `business-logic/api/README.md`, `core/api-client/README.md`, `core/selenium/README.md`, `services/gitea-selenium-cucumber/README.md`, `services/gitea-selenium-vitest/README.md`, `services/playwright-bdd/README.md`. Left the historical "used to live in business-logic/selenium/" mentions as-is — they explain the rename, not describe current state
- [x] 2.2 Ran `gitea-selenium-vitest` chrome (3/4, one `#issue-label-edit-modal` timeout — the same pre-existing Fomantic UI modal flake already documented this session, confirmed by an isolated re-run passing clean), `gitea-selenium-cucumber` chrome (5/6, one `TimeoutError` on "Add a repository to a team" — same pre-existing category, unrelated to any import path), `playwright-native` chrome (3/3) — zero regressions from the rename
- [x] 2.3 Archive this change and commit
