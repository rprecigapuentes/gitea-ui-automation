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

## 8. Organizations smoke

- [x] 8.1 Add an automatic fixture to `hooks-fixtures.ts` that deletes `scenarioState.organization` after each test, and make `visual.fixture.ts` extend `hooks-fixtures`; verify the organization is gone after a passing run and after a run whose test throws.
- [x] 8.2 Add the organizations smoke spec: the empty create form, then the organization profile and its teams tab after creating the organization and a team through the API in the test body; verify the three views are checked on the three browsers, the baselines are recorded, and four consecutive runs pass.

## 9. Run the visual suite from its own workflow

- [x] 9.1 Add `{platform}` to the visual `snapshotPathTemplate` and move the committed baselines into `baselines/<project>/win32/`; verify `npm run test:visual` passes locally against the moved baselines.
- [x] 9.2 Add `test:visual:ci`, which runs the three visual projects with the html reporter and `PLAYWRIGHT_HTML_OPEN=never`; verify it leaves `playwright-report/index.html` and returns without opening anything.
- [x] 9.3 Add `.gitea/workflows/visual.yml`, dispatch only, with the container, `gitea-test`, the three accounts and tokens, the branded browsers, a `record_baselines` input, and uploads of the native report and of the recorded baselines with `if: always()`; verify the workflow parses and `ct.yml` does not reference it.
- [ ] 9.4 Dispatch the workflow once to record the runner's baselines, review the artifact and commit it under `linux/`; verify a second dispatch passes and publishes the native report.
- [ ] 9.5 Remove the temporary `push` trigger from `.gitea/workflows/visual.yml`; verify the workflow is dispatch-only before the branch merges, so the suite never runs on a push again.

## 10. Smoke catalog

- [x] 10.1 Make the clean-up hook remove an organization's repositories before the organization, adding the organization-repositories query to `RepositoryClient`, and move the specs into per-area folders; verify the login spec still passes from `authentication/` and an organization holding a repository is gone after a run.
- [x] 10.2 Add three organization smokes under `organizations/`: create an organization through the form, create a team, and browse the repositories and members of an organization; verify each checks its views on the three browsers and leaves nothing behind.
- [x] 10.3 Add three smokes under `issues/` and `project-board/`: the issue list and an issue, the issue form with its labels and milestones, and the project board with cards; verify each checks its views on the three browsers and leaves nothing behind.
- [x] 10.4 Record the win32 baselines of the new views; verify two consecutive local runs list only the views whose regions still vary.
- [ ] 10.5 Let a push record baselines when its commit message says `[record-baselines]`, and record the runner's baselines of the new views; verify a push without the marker compares and passes on views without volatile regions.
- [x] 10.6 Replace the single-process `test:visual` and `test:visual:update` with `scripts/visual.mjs`, which runs one process per browser with `--workers=1` and blob reports, merges them into one native report and opens it; make `test:visual:<browser>` single-worker; verify the browsers run in parallel while each browser's specs run one after another, and one report covers all three.
- [ ] 10.7 Give the workflow's token the four scopes the smokes need; verify a dispatch that records baselines passes all 21 tests, the repository views show their repositories, and the project board shows its two cards.
