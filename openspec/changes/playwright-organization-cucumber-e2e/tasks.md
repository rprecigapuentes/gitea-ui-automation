## 1. Seeded users

- [ ] 1.1 Add `resolveAdminToken` to `fixtures/credentials.ts`
- [ ] 1.2 Add the `seededUsers` fixture to `fixtures/hooks-fixtures.ts`

## 2. Pipeline

- [ ] 2.1 Mint the admin token in the `playwright-native` job of `ct.yml` and prove it holds `write:admin`

## 3. The scenario

- [ ] 3.1 Port "Change team members permissions" to `tests/organization-cucumber-e2e.spec.ts`
- [ ] 3.2 Run it on chrome, firefox and edge, alone and with `test:parallel`

## 4. Wrap up

- [ ] 4.1 Document the spec and the fixture in the README
- [ ] 4.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
