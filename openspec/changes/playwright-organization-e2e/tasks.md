## 1. Hooks fixture

- [x] 1.1 Add `ORGANIZATION_TAG` and `cleanupOrganizationsBeforeRun` to `fixtures/hooks-fixtures.ts`

## 2. Port the organization test

- [x] 2.1 Write `tests/organization.spec.ts`, replicating the Vitest steps through `pageObjects`
- [x] 2.2 Run it on chrome, firefox and edge, alone and with `test:parallel`

## 3. Align the Playwright strategy

Found while running 2.2: the port failed on three points where `PlaywrightInteractionStrategy` differed from the Selenium contract the page objects assume.

- [x] 3.1 `isVisible` searches inside `root` instead of the whole page
- [x] 3.2 `findElements` waits for visible matches and throws when none appears
- [x] 3.3 `type` appends keystrokes and `getAttribute` reads the live property

## 4. Pipeline

Found on the first pipeline run: the `playwright-native` job of `ct.yml` had no invited accounts, so the spec failed with "Missing invited credentials".

- [x] 4.1 Declare the `GITEA_INV_<BROWSER>` variables and register the three invited accounts in the `playwright-native` job, as the Selenium job does

## 5. Wrap up

- [x] 5.1 Document the spec and fixture in the README
- [x] 5.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
