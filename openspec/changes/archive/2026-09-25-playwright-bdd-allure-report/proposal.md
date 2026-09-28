## Why

`services/playwright-bdd` reports only through the stock Playwright HTML report and JUnit. The other functional suites report through Allure, and a run is easier to judge on that one page. Today nobody can see an Allure report of the BDD suite, and after a local run the report is not opened for them.

## What Changes

- Add the `allure-playwright` reporter, the `allure` CLI and an `allurerc.js` to `services/playwright-bdd`, mirroring `playwright-native`, plus its `report` and `report:open` scripts.
- Wrap the test scripts (`test`, `test:chrome`, `test:firefox`, `test:edge`, `test:parallel`) in a small script that clears `allure-results`, runs the tests, generates the Allure report and opens it, whatever the outcome, and exits with the tests' own exit code.
- On CI the wrapper only runs the tests: the pipeline already generates and uploads the report in its own steps, and an open report would keep the job waiting.

## Capabilities

### Modified Capabilities

- `playwright-bdd`: results are also reported through Allure, and a local run ends by showing that report.

## Impact

New: `services/playwright-bdd/{allurerc.js,scripts/run-with-report.mjs}`. Modified: `services/playwright-bdd/{package.json,playwright.config.ts}` and `package-lock.json`.

## Out of Scope

- The CI workflows and the artifacts they upload.
- Changes to `playwright-native` or the Selenium suites.
- Showing the report for the accessibility, visual or performance suites.
