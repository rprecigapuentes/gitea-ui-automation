## 1. Run the three browsers from the suite's test script

- [x] 1.1 In `services/gitea-selenium-cucumber/package.json`, point `test` at the three-process `concurrently` invocation that `test:parallel` already defines, keeping `pretest` so `allure-results` is cleared once before the three processes write into it. Verify locally with `npm test -w @gitea-automation/gitea-selenium-cucumber -- --tags @smoke` producing three coloured process prefixes and a non-zero exit when one browser fails.
- [x] 1.2 In `features/support/hooks.ts`, set the Allure `browser` parameter from `BROWSER` in the scenario `Before` hook, through `allure-js-commons` as the vitest suite's `config/allure.config.ts` does, and declare that dependency in the workspace. Verify by generating the report from the local run and reading `browser: chrome|firefox|edge` on each scenario.
- [x] 1.3 Update `services/gitea-selenium-cucumber/README.md` (Running section) and the root `README.md` command table so `npm test` and `npm run test:cucumber` read as the three browsers, and `test:chrome`/`test:firefox`/`test:edge` as the single-browser way. Verify with `npm run format:check`.

## 2. Confirm in CT

- [x] 2.1 Push and let CT run. Verify the Cucumber job's step log shows the three process prefixes, the artifact's Allure report lists each scenario three times with a `browser` parameter, `reports/healenium/` holds about 39 sessions, and every `*.heals.json` still has an empty `data` array.
