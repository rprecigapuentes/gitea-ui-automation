## 1. Install and configure

- [x] 1.1 Add `playwright-bdd`, `@playwright/test` and the shared workspace dependencies to `services/playwright-bdd`, with its `tsconfig.json`, `.gitignore`, `.env.example` and the generate/test scripts
- [x] 1.2 Add `playwright.config.ts` with the chrome, firefox and edge projects, the reporters and parallel workers, mirroring `playwright-native`

## 2. Fixtures

- [x] 2.1 Add the credentials module and the fixtures (`strategy`, `pageObjects`) with `createBdd`, mirroring `playwright-native`. `createBdd` only accepts a `test` extended from `playwright-bdd`, and the fixtures file has to be listed in the `steps` option

## 3. Login scenario

- [x] 3.1 Copy `login.feature` from the Cucumber service and add its step definitions over the page objects. The owner credentials come from an `ownerCredentials` fixture, since `$testInfo` is not typed on the step arguments
- [x] 3.2 Run the scenario on chrome, firefox and edge, alone, in parallel (`test:parallel`) and in one process (`test`)

## 4. Wrap up

- [x] 4.1 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
- [x] 4.2 Archive the change
