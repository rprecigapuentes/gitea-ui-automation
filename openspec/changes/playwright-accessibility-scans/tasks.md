# Tasks

## 1. Install the scanner and fix the rule set in one place

- [x] 1.1 Add `@axe-core/playwright` to `services/playwright-native` and a `makeAxeBuilder` fixture extending the suite fixture, carrying `withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])` and no exclusion; verify `npm run typecheck -w @gitea-automation/playwright-native` passes and a throwaway scan returns a result object.

## 2. Give the non-functional suites their own projects

- [x] 2.1 Lift the three browser definitions in `playwright.config.ts` into one list, derive the functional projects from it with `testIgnore` on `non-functional/`, derive the `accessibility-*` projects with `testDir` on `tests/non-functional/accessibility`, one shared baseline path and no retries, and add the `test:a11y` (Chromium) and `test:a11y:all` (every browser) scripts; verify `npm test` runs no scan, `test:a11y` runs nothing else, and `test:a11y:all` passes on all four against the same baselines.

## 3. Scan the three pages

- [x] 3.1 Add the login scan, as an anonymous visitor; verify it runs on the three browsers and reports violations rather than erroring.
- [x] 3.2 Add the user dashboard and organization creation scans, signed in through `sessionManager.loginAsOwner`; verify each scans the page rendered for the signed-in owner rather than a redirect to the login form.

## 4. Publish the evidence

- [x] 4.1 Attach the full axe result to the test through `testInfo.attach` and write it to `reports/accessibility/<page>-<browser>.json`, on pass and on fail; verify Allure shows the attachment and the three browsers leave three files per page.

- [x] 4.2 Add `scripts/accessibility-summary.mjs` and the `report:a11y` script, writing `reports/accessibility/summary.html` as one self-contained page with the counts per impact and a card per distinct rule, and run it from the workflow with `if: always()`; verify the artifact answers the severity question on opening, without a raw result and without a network connection.

- [x] 4.3 Retain a trace for a scan that failed and upload it with the evidence, so a violation can be inspected in the DOM it fired on rather than only read as a selector; verify a failing scan leaves a `trace.zip`, a passing one leaves none, and Allure offers it.

## 5. Decide the outcome against a baseline

- [x] 5.1 Assert a `{ rule, targets }` fingerprint against `toMatchSnapshot`, record the first baseline per page and browser, and commit it; verify a re-run passes unchanged and a deliberately broken page fails naming the rule.

## 6. Run it from its own workflow

- [x] 6.1 Add `.gitea/workflows/accessibility.yml`, dispatch-only, carrying the container, the `gitea-test` service and the account seeding of the Playwright job in `ct.yml`, running `npm run test:a11y` and uploading `reports/accessibility/` and the Allure report with `if: always()`; verify one dispatched run is green end to end and both artifacts are downloadable.

- [x] 6.2 Remove the temporary `push` trigger from `.gitea/workflows/accessibility.yml`; verify the workflow is dispatch-only before the branch merges, so a scan never runs on a push again.

## 7. Triage the inventory

- [ ] 7.1 Read the published report, group the violations by `impact`, and record the count per severity per page in the pull request; verify every violation in the baseline is accounted for in that count.

## 8. Documentation

- [x] 8.1 Document the scans, the `test:a11y` script, how a baseline is re-approved and the new workflow in the root and `services/playwright-native` READMEs; verify no README still describes `playwright-native` as functional-only.
