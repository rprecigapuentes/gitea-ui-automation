# Tasks

## 1. Point the suite at the application under test

- [ ] 1.1 Read the base URL from `GITEA_BASE_URL` in `playwright.config.ts`, with a local default; verify `npm run typecheck -w @gitea-automation/playwright-native` passes and a bare `page.goto("/")` resolves against a local Gitea.
- [ ] 1.2 Replace `tests/example.spec.ts` with a smoke asserting the deployed Gitea serves its landing and sign-up pages; verify the smoke passes against a local Gitea and no test reaches `playwright.dev`.

## 2. Make the browser matrix mean what it says

- [ ] 2.1 Set `channel: "chrome"` and `channel: "msedge"` on the branded projects; verify `npm run test:chrome` and `npm run test:edge -w @gitea-automation/playwright-native` each launch the named product rather than bundled Chromium.

## 3. Report through Allure

- [ ] 3.1 Add `allure` and `allure-playwright`, an `allurerc.js` matching the Selenium suites', the Allure reporter in `playwright.config.ts` and the `pretest`/`report` scripts; verify `npm test` followed by `npm run report -w @gitea-automation/playwright-native` produces `allure-report/` carrying one result per browser.

## 4. Split the workflow into two jobs

- [ ] 4.1 Rename the `regression` job to `selenium`, leaving its matrix and steps untouched; verify `npm run format:check` passes and a dispatched run still covers both Selenium suites.
- [ ] 4.2 Add a `playwright` job with `needs: selenium` and `if: always()`, its own `gitea-test` service, `mcr.microsoft.com/playwright:v1.63.0-noble` as its container, `actions/setup-node` from `.nvmrc`, `npx playwright install chrome msedge`, the suite, the Allure report and its own artifact, and add `playwright-native` to the dispatch `suite` options; verify a push to the branch runs both jobs and uploads `allure-report-playwright-native`.

## 5. Documentation

- [ ] 5.1 Document the Playwright job in the root README and correct the `services/playwright-native` README passage arguing a `channel` is not viable on CI; verify no README still describes the branded projects as bundled Chromium.

## 6. Verify

- [ ] 6.1 Confirm one green run per browser on the branch: `chrome`, `firefox` and `edge` each pass in the Playwright job and each is named in its Allure report. The temporary push trigger is then removed by `ct-drop-healenium` task 3.3, which closes the branch.
