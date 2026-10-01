# playwright-native

> Playwright's own test runner, on Chrome, Firefox and Edge: the functional suite, plus the three
> non-functional ones (accessibility, visual and performance).

![Playwright 1.63](https://img.shields.io/badge/Playwright-1.63-2EAD33?logo=playwright&logoColor=white)
![axe-core](https://img.shields.io/badge/axe--core-4.13-663399)

## Contents

- [Quick start](#quick-start)
- [Functional tests](#functional-tests)
- [Fixtures](#fixtures)
- [Projects](#projects)
- [Accessibility scans](#accessibility-scans)
- [Visual testing](#visual-testing)
- [Performance metrics](#performance-metrics)
- [Configuration](#configuration)
- [Structure](#structure)

## Quick start

```bash
npm install                                         # from the repository root
npx playwright install chrome msedge firefox        # the real Chrome and Edge, and Firefox
npm test -w @gitea-automation/playwright-native     # the functional suite, three browsers
```

| Command                                        | Runs                                                     |
| ---------------------------------------------- | -------------------------------------------------------- |
| `npm test`                                     | the functional suite, three browsers as three processes  |
| `npm run test:chrome` / `:firefox` / `:edge`   | one browser                                              |
| `npm run test:headed` / `test:parallel:headed` | the same, with the browser windows shown                 |
| `npm run test:a11y` · `report:a11y`            | accessibility scans · their summary                      |
| `npm run test:visual`                          | screenshot comparison, three browsers, one merged report |
| `npm run test:perf` · `report:perf`            | page-load measurements · their summary                   |
| `npm run report` / `report:open`               | build / open the Allure report                           |

Every script sets `BROWSER`, which gives each process its own `reports/junit-<browser>.xml`,
`test-results/<browser>/` and `playwright-report/<browser>/`, so parallel browsers never overwrite
each other.

## Functional tests

The same cases as the Selenium suites, written as plain Playwright tests over the shared page
objects. `test.step` names each phase in the report.

| Spec                                  | Case                                                                       | From     |
| ------------------------------------- | -------------------------------------------------------------------------- | -------- |
| `login-ui.spec.ts`                    | sign in through the form                                                   | both     |
| `organizations-e2e.spec.ts`           | an organization, two teams, a member added and removed                     | Vitest   |
|                                       | team permissions: who can write, read or lose access                       | Cucumber |
| `organizations-smokes.spec.ts`        | the five organization smokes                                               | Cucumber |
| `project-board.spec.ts`               | the Kanban board: template, cards, columns                                 | Cucumber |
| `project-board-drag-and-drop.spec.ts` | a card dragged to another column stays there                               | Cucumber |
| `demo-e2e.spec.ts`                    | a work item from team assignment to the board that tracks it               | Cucumber |
| `issue-metadata.spec.ts`              | AT-ISS-01: an issue keeps its metadata, closing it completes the milestone | Vitest   |
| `scoped-labels.spec.ts`               | AT-ISS-02: a scoped label replaces the label of its own scope              | Vitest   |

Specs call the page objects through the `pageObjects` fixture and assert their answers. A
`page.locator`, `page.goto` or `page.getBy*` in a spec fails lint.

```ts
test("a card dragged onto another column is kept there by the board", async ({
  pageObjects,
  sessionManager,
  seededOrganizationWithRepositories,
}) => {
  await sessionManager.loginAsOwner();
  await pageObjects.projectBoardPage.moveCard(first.issue.id, "In Progress");
  expect(await pageObjects.projectBoardPage.getColumnIssueCount("In Progress")).toBe(1);
});
```

## Fixtures

`fixtures/fixture.ts` is the suite's `test`: the shared fixtures from
[`shared-playwright`](../_shared/playwright/README.md) and their automatic cleanup. The other files
extend it, one per area, so a spec imports the one it needs:

| File                        | Adds                                                                             |
| --------------------------- | -------------------------------------------------------------------------------- |
| `fixture.ts`                | `strategy`, `clients`, `pageObjects`, `scenarioState`, `sessionManager`, cleanup |
| `issues-fixtures.ts`        | `owner`, `repository`, `issue`, `maintainer`, `classificationLabel`, `milestone` |
| `organizations-fixtures.ts` | `existingOrganization`, `seededUsers`, `seededOrganizationWithTeamAndRepository` |
| `project-board-fixtures.ts` | `seededOrganizationWithRepositories`, `seededMilestone`, `kanbanProject`         |
| `axe.fixture.ts`            | `makeAxeBuilder`, `publishScan`                                                  |
| `visual.fixture.ts`         | `visualTester`                                                                   |
| `performance.fixture.ts`    | `performanceCollector`, `publishMeasurement`, `verifyAgainstBaseline`            |

A fixture's setup runs only for a test that names it, and its teardown runs even when that test
fails.

## Projects

Every project derives from one browser list in `playwright.config.ts`, so a browser is defined once.
`chrome` and `edge` set a channel and drive the real products; without it both would run the same
bundled Chromium.

| Project                                     | Runs                                        |
| ------------------------------------------- | ------------------------------------------- |
| `chrome`, `firefox`, `edge`                 | the functional suite                        |
| `accessibility-chromium`                    | the scans, without retries                  |
| `accessibility-chrome`, `-firefox`, `-edge` | the same scans, on demand (`test:a11y:all`) |
| `visual-chrome`, `-firefox`, `-edge`        | the screenshot comparisons, without retries |
| `performance-chromium`                      | the measurements, one worker, no trace      |
| `seeds-chrome`                              | starting states for the Playwright agents   |

## Accessibility scans

`tests/non-functional/accessibility/` scans the login form, the dashboard and organization creation
with [`@axe-core/playwright`](https://playwright.dev/docs/accessibility-testing) against WCAG 2.0 and
2.1, levels A and AA.

```bash
npm run test:a11y -w @gitea-automation/playwright-native          # scan on Chromium
npm run report:a11y -w @gitea-automation/playwright-native        # write summary.html
npm run test:a11y:update -w @gitea-automation/playwright-native   # re-record the baselines
```

**A scan fails on a change, not on what Gitea already has.** Each one compares a sorted
`rule <tab> target` list with `baselines/<page>-violations.txt`, so a new violation fails the run and
the known ones do not. One baseline per page serves every browser, because axe reads the DOM.

| Output                                        | Answers                                                           |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `reports/accessibility/summary.html`          | how many violations, at what impact, against which WCAG criterion |
| `reports/accessibility/<page>-<browser>.json` | the full axe result                                               |
| `allure-report/`                              | did the scan pass, in the format every suite publishes            |
| `test-results/…/trace.zip`                    | a trace of a failed scan, to inspect the offending element        |

The WCAG criteria in the summary are a reading of the findings, never a conformance claim: what no
rule reaches is unevaluated, not met.

## Visual testing

`tests/non-functional/visual/` compares views with recorded screenshots through
[`VisualTester`](../../core/playwright/README.md): the main view (desktop and phone width),
organizations, issues and the project board.

```bash
npm run test:visual -w @gitea-automation/playwright-native           # three browsers, one report
npm run test:visual:chrome -w @gitea-automation/playwright-native    # one browser
npm run test:visual:update -w @gitea-automation/playwright-native    # re-record every baseline
```

- **Soft checks.** A spec that looks at five views reports every one that changed.
- **Masks** cover what changes between runs: the footer's render timings always, and each page's own
  regions through `getVolatileRegions()`.
- **Baselines are per browser and platform**, `baselines/<project>/<platform>/<view>.png`: a Windows
  recording is never compared with a Linux run.
- **Writing a spec:** create the state through `clients`, open the view through its page object,
  name what you create per project (`at-vis-<area>-<project>`) so the text is the same every run,
  and record the organization in `scenarioState` so cleanup removes it.

In CI, the `visual` job compares against the committed baselines. A missing baseline is written,
the job fails on it and publishes it as `visual-baselines-linux`, for a person to review and commit.
A dispatch with `record_baselines`, or a commit message containing `[record-baselines]`, records
them all.

## Performance metrics

`tests/non-functional/performance/` measures what it costs to arrive at the login form, the
dashboard and organization creation, for one user. It is not load testing.

```ts
await sessionManager.loginAsOwner();
const measurement = await performanceCollector.measure("dashboard", () =>
  pageObjects.mainPage.open(),
);
await publishMeasurement(measurement);
await verifyAgainstBaseline(measurement);
```

- **Five loads, cold and warm**, each published as a median with its spread.
- **Two files per page** in `reports/performance/`: the figures as JSON, and the network exchange as a
  `.har` to open in a browser's network panel. `report:perf` turns them into `summary.html`.
- **Bands, not exact figures.** `baselines/<page>.json` holds an upper bound per metric: a multiple
  of the recorded median, never below a floor. A page with no band records one and fails, so a band
  is never approved silently.
- **A band belongs to the machine that recorded it.** The committed bands are the CI runner's,
  published as `performance-baselines-linux`.

## Configuration

`.env` in this folder. `<BROWSER>` is `CHROME`, `FIREFOX` or `EDGE`; the `chromium` projects use the
Chrome accounts.

| Variable                              | For                                                                  |
| ------------------------------------- | -------------------------------------------------------------------- |
| `GITEA_BASE_URL`                      | the Gitea under test, `http://localhost:3000` by default             |
| `GITEA_OWNER_<BROWSER>`, `…_PASSWORD` | one owner account per browser                                        |
| `GITEA_INV_<BROWSER>`, `…_PASSWORD`   | one invited account per browser                                      |
| `GITEA_TOKEN_<BROWSER>`               | the owner's token: write on user, repository, issue and organization |
| `GITEA_ADMIN_TOKEN`                   | an administrator's token, for the seeded users                       |
| `HEADED=1`                            | show the browser windows                                             |

A token missing a scope does not fail the API call that needed it: the Playwright request context
returns the error as the body, and the test fails later, on a page that never renders.

## Structure

```
services/playwright-native/
├── playwright.config.ts            projects, reporters, timeouts
├── fixtures/                       the suite's test and one fixture file per area
├── scripts/                        accessibility and performance summaries, the visual runner
└── tests/
    ├── *.spec.ts                   the functional suite
    ├── seeds/                      starting states for the Playwright agents
    └── non-functional/
        ├── accessibility/          scans and their baselines
        ├── visual/                 screenshot checks and their baselines
        └── performance/            measurements and their bands
```
