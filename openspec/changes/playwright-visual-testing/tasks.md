# Tasks

## 1. Give the visual tester a package of its own

- [x] 1.1 Add the `core/playwright` workspace package (`@gitea-automation/core-playwright`) with `VisualTester.verifyPage` and `verifyComponent`, and depend on it from `services/playwright-native`; verify `npm run typecheck -w @gitea-automation/playwright-native` passes and the import `@gitea-automation/core-playwright/visual-tester/visual-tester` resolves.
- [x] 1.2 Make both checks `expect.soft`; verify a deliberately differing page fails the test with the steps after the check still executed.

## 2. Expose it as a fixture

- [x] 2.1 Add `fixtures/visual.fixture.ts` extending the suite fixture with `visualTester`; verify a spec importing `test` from it receives the tester and a functional spec's fixtures are unchanged.

## 3. Give the suite its own project

- [x] 3.1 Add the `visual-chromium` project in `playwright.config.ts` on `tests/non-functional/visual/`, baselines under `{testDir}/baselines/{projectName}`, no retries; verify `npm test` runs no visual spec and the project runs nothing else.
- [x] 3.2 Add the `test:visual` script (runs only the project, opens the native HTML report on pass and fail) and `test:visual:update`; verify a run opens the report and the update script writes `login-page.png` under `baselines/visual-chromium/`.

## 4. Sign the login page's visual spec in

- [x] 4.1 Resolve a `chromium` project's owner credentials from the Chrome account in `fixtures/credentials.ts`; verify `visual-chromium` reads `GITEA_OWNER_CHROME` and a Firefox project still reads its own.
- [x] 4.2 Add the login-page visual spec: check the page against `login-page.png`, sign in, and assert the dashboard and current organization; verify the sign-in steps run and pass while the visual check is the only failure.

## 5. Stabilise the login baseline

- [x] 5.1 Keep the Gitea footer's render timings out of the comparison, through the mask argument added in 7.2; verify the login spec passes on four consecutive runs against one recorded baseline.

## 6. Run on every browser, in parallel

- [x] 6.1 Derive `visual-chrome`, `visual-firefox` and `visual-edge` from the `browsers` list in `playwright.config.ts`, replace `visual-chromium` and delete its baseline; verify `npx playwright test --list --project=visual-chrome --project=visual-firefox --project=visual-edge` lists the login spec once per project and `npm test` runs none of them.
- [x] 6.2 Make `test:visual` run the three projects in one process and open one HTML report, keep `test:visual:update` recording all three, and add `test:visual:chrome`, `:firefox` and `:edge`; verify one run shows all three projects in a single report and each per-browser script runs only its own.
- [x] 6.3 Record the three baselines under `baselines/visual-<browser>/`; verify the projects run in parallel (overlapping start times in the list output) and each signs in with its own browser's account.

## 7. Volatile regions

- [x] 7.1 Add `getVolatileRegions(): string[]` to `BasePage`, returning an empty list, so every page object has it and can override it; verify `npm run typecheck -w @gitea-automation/playwright-native` passes and a page object that does not override it returns `[]`.
- [x] 7.2 Let the visual tester take a list of selectors to mask per check, and a default list from its fixture holding the footer, replacing 5.1's single-purpose argument; verify the login spec passes on four consecutive runs and a spec passing `getVolatileRegions()` masks those regions.
