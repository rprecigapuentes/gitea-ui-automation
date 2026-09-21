## 1. Seeded users

- [x] 1.1 Add `resolveAdminToken` to `fixtures/credentials.ts`
- [x] 1.2 Add the `seededUsers` fixture to `fixtures/hooks-fixtures.ts`

## 2. Pipeline

- [x] 2.1 Mint the admin token in the `playwright-native` job of `ct.yml` and prove it holds `write:admin`

## 3. The scenario

- [x] 3.1 Port "Change team members permissions" to `tests/organization-cucumber-e2e.spec.ts`
- [x] 3.2 Run it on chrome, firefox and edge, alone and with `test:parallel`. It exposed that `isVisible` had no default timeout and waited for the test's own; it now waits 5 seconds like Selenium. The scenario takes about a minute, so the config sets a 120 second test timeout

## 4. Wrap up

- [x] 4.1 Document the spec and the fixture in the README
- [x] 4.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
