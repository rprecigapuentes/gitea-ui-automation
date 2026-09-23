# Tasks

## 1. Give the area its own project and entry point

- [x] 1.1 Add a `performance-chromium` project on `tests/non-functional/performance/` with one worker, no retries and tracing off, and the `test:perf` script with its `pretest:perf` cleanup of `allure-results` and `reports/performance`; verify `npm test` runs no measurement, `test:perf` runs nothing else, and the project resolves its account from the existing `GITEA_OWNER_CHROME` variables without new seeding.

## 2. Collect the figures

- [x] 2.1 Add a performance fixture extending the suite fixture, handed the page as the scanner is, returning the phases of the navigation, the first contentful and largest contentful paint, and the count and transferred weight of the page's resources for one load; verify a throwaway measurement on the login page returns figures and `npm run typecheck -w @gitea-automation/playwright-native` passes.

- [x] 2.2 Load each page several times within one measurement and report the median with its spread, keeping the cold load of a fresh context and a warm reload as two figures; verify two consecutive runs of the same page report medians closer to one another than the spread of either, and that the cold and warm figures are never combined.

## 3. Explain the figures

- [x] 3.1 Open a protocol session on the same page and read the engine's script, layout and style counters; verify the three are non-zero on the dashboard, that the value read describes the load just measured rather than the session before it, and that a browser exposing no counters publishes the remaining figures rather than failing.

- [x] 3.2 Record the network exchange per test through the context options, without response bodies, into the directory the run publishes; verify each test leaves its own recording, that no two overwrite one another, and that one opens in a browser's network panel showing status codes and cache headers.

## 4. Measure the pages

- [x] 4.1 Measure the login page as an anonymous visitor, navigating through its page object; verify the published figures describe the login page and no session is established first.

- [x] 4.2 Measure the user dashboard and organization creation signed in through `sessionManager.loginAsOwner`, reading after the page object opens the page; verify the dashboard figures differ from those the session's own navigation to the base URL would have produced, and that each page is read after its ready locators resolve.

## 5. Publish the evidence

- [x] 5.1 Write the full figures to `reports/performance/<page>-<browser>.json` and attach them to the test result, on pass and on fail; verify Allure shows the attachment and a failed measurement still leaves its file.

- [x] 5.2 Add `scripts/performance-summary.mjs` and the `report:perf` script, writing `reports/performance/summary.html` as one self-contained page with a table per page and what the recording says about compression, completion and caching, and run it from the workflow with `if: always()`; verify the artifact answers what each page costs on opening, without a raw file and without a network connection.

## 6. Decide the outcome against a band

- [x] 6.1 Judge each metric against a tolerance band committed under `tests/non-functional/performance/baselines/`, recording one for a page that has none rather than passing silently; verify a re-run inside the band passes, a deliberately slowed page fails naming the metric, the recorded band and the observed value, and a page with no band records one.

## 7. Run it from its own workflow

- [x] 7.1 Add `.gitea/workflows/performance.yml`, dispatch-only and in a concurrency group of its own, carrying the container, the `gitea-test` service and the account seeding of the accessibility workflow, running `test:perf` and uploading `reports/performance/` and the network recordings with `if: always()`; verify one dispatched run is green end to end, both artifacts download, and a second dispatch while the first runs does not measure alongside it.

- [x] 7.2 Record the runner's bands from a dispatched run and commit them; verify a second dispatched run passes against them without recording anything new.

## 8. Read the numbers

- [x] 8.1 Read the published figures and record in the pull request what each page costs cold and warm, with its request count and transferred weight, and what the network recording shows about caching and compression; verify every page measured is accounted for in that reading.

## 9. Documentation

- [x] 9.1 Document the area, the `test:perf` script, how a band is re-approved and the new workflow in the root and `services/playwright-native` READMEs; verify no README still describes the Playwright suite as carrying two non-functional areas.
