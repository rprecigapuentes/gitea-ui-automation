## 1. Record a failing functional test

- [x] 1.1 Add `video: "on-first-retry"` to the functional projects' `use` in `services/playwright-native/playwright.config.ts`, the mode their trace already uses, and verify the non-functional projects are untouched.
- [x] 1.2 Give the `visual` project `use: { trace: "retain-on-failure" }` in the same file, and verify it now differs from the global `on-first-retry` it inherited, which its `retries: 0` made unreachable.

## 2. Emit one machine-readable result format

- [x] 2.1 Add the `junit` reporter to `services/playwright-native/playwright.config.ts`, writing `reports/junit-<browser>.xml` when `BROWSER` is set and `reports/junit.xml` when it is not, the way `services/gitea-selenium-vitest/vitest.config.ts` already resolves it; verify `test:parallel`'s three processes leave three files.
- [x] 2.2 Add the `junit` format to `services/gitea-selenium-cucumber/cucumber.mjs`, resolved the same way from `BROWSER`, because `test:parallel` runs the three browsers as three processes against one config file; verify all three files survive a run.
- [x] 2.3 Verify `reports/` is ignored by git in both workspaces, so no result file is ever committed.

## 3. Publish what the run produced

- [x] 3.1 Add `services/playwright-native/test-results/` and `services/<suite>/reports/junit*.xml` to the functional jobs' upload steps in `.gitea/workflows/ct.yml`, and verify the Cucumber job no longer warns about a missing path.
- [x] 3.2 Add `services/playwright-native/test-results/` to the visual workflow's upload step, so the trace task 1.2 enables is published.

## 4. Confirm it on the runner

- [x] 4.1 Run the three gates, `npm run format`, `npm run lint` and `npm run typecheck`, and verify all three pass.
- [x] 4.2 Push and verify on the runner that a green functional run publishes a `junit` file per browser and no recording, so the cost of the change on a passing run is nothing.
