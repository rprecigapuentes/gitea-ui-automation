## 1. Admin-scoped user creation and deletion

- [x] 1.1 In `business-logic/selenium/api/clients/user.client.ts`, added `createUser(username, email, password)` (`POST admin/users`, `must_change_password: false`) and `deleteUser(username)` (`DELETE admin/users/{username}`). In `services/gitea-selenium-cucumber/features/support/credentials.ts`, added `resolveAdminToken()` reading `GITEA_ADMIN_TOKEN` (no per-browser suffix), throwing a named error if missing. Verified: `npm run typecheck -w @gitea-automation/business-logic-selenium` and `-w @gitea-automation/gitea-selenium-cucumber`, `npx eslint` on both files - all clean.

## 2. Provision and tear down two users per run

- [x] 2.1 Created `services/gitea-selenium-cucumber/features/support/seeded-users.ts`: `SeededUser { username, password }`, a module-level store, `createSeededUsers()` (creates 2, named `at-user-<n>-<browser>-<suffix>` via the existing `uniqueSuffix()` convention), `deleteSeededUsers()` (deletes each, logging and continuing past a per-user failure, matching the org-cleanup pattern), and `getSeededUser(index)`. Wired `createSeededUsers()` into `hooks.ts`'s existing `BeforeAll` and `deleteSeededUsers()` into a new `AfterAll`. Verified: `npm run typecheck -w @gitea-automation/gitea-selenium-cucumber` and `npx eslint` on the new and edited files - all clean.

## 3. Verify for real

- [x] 3.1 Real run confirmed with a temporary debug log (added, checked, removed): single-browser `--tags "@smoke"` created `at-user-1-chrome-*`/`at-user-2-chrome-*`, both scenarios passed, and an admin-token listing showed 0 `at-user-` accounts afterward. `cross-env CUCUMBER_TAGS="@smoke" npm run test:parallel` (all 3 browsers) created 6 distinctly-named users (`at-user-{1,2}-{chrome,firefox,edge}-*`, no collisions), all 3 processes exited 0, and the same listing showed 0 afterward. A final `--tags "@organizations"` run (3 scenarios / 14 steps) also passed clean with the hook active.
