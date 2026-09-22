## 1. Seeded users

- [x] 1.1 Add `resolveAdminToken` to `fixtures/credentials.ts`
- [x] 1.2 Add the `seededUsers` fixture to `fixtures/hooks-fixtures.ts`

## 2. Pipeline

- [x] 2.1 Mint the admin token in the `playwright-native` job of `ct.yml` and prove it holds `write:admin`

## 3. The scenario

- [x] 3.1 Port "Change team members permissions" to `tests/organization-cucumber-e2e.spec.ts`
- [x] 3.2 Run it on chrome, firefox and edge, alone and with `test:parallel`. It exposed that `isVisible` had no default timeout and waited for the test's own; it now waits 5 seconds like Selenium

## 4. Review fixes

- [x] 4.1 `resolveAdminToken` reads the env var directly, no throw; the test carries no helper functions, everything inline behind `test.step`
- [x] 4.2 Removing the config timeout reproduced the original failure exactly (30s default, the same locator hung past it), confirming it, not something else, was the cause; restored it. Inlining also surfaced a missed `navigateToTeamsTab()` between two team switches, and a wrong expected count (qa-team keeps user1 after user2 is removed, so "1 members" not "0") — both fixed
- [x] 4.3 Re-ran on chrome, firefox and edge, alone and with `test:parallel`, twice: 12/12 each run. One `test:parallel` run flaked once on edge (`fillFileName` losing its first keystrokes under the three browsers' shared load) and passed standalone and on the next parallel run — the same class of load-sensitive flake other suites' comments already document, left alone here

## 5. Wrap up

- [x] 5.1 Document the spec and the fixture in the README
- [x] 5.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
