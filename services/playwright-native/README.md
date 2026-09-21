# playwright-native

UI automation against Gitea with Playwright's native test runner (`@playwright/test`), as part of the `gitea-ui-automation` monorepo. A smoke suite today: it drives the application under test on real Chrome, Firefox and Edge, and runs nightly on CT alongside the Selenium suites.

## What's here

- `tests/gitea-smoke.spec.ts` — asserts the Gitea at `baseURL` serves its landing page and the sign-up form, on every browser in the matrix. `playwright.config.ts` reads that URL from `GITEA_BASE_URL`, falling back to `http://localhost:3000`, so the suite points at whatever instance you give it. Nothing here logs in; account-level flows wait on the page objects described at the end of this README.
- `allurerc.js` and the `allure-playwright` reporter, the same Allure 3 setup the Selenium suites use. `npm run report` turns `allure-results/` into a single-file `allure-report/index.html`, and each result carries the project it ran on, so a failure names its browser without opening the job log. The stock `html` reporter runs alongside it and writes `playwright-report/` during the run, with no generation step of its own.
- `chrome`, `firefox` and `edge` project configs, matching the browser matrix the Selenium services already cover. `playwright.config.ts` derives them from one browser list, and derives the non-functional projects from the same list, so a browser is defined once. `chrome` and `edge` set `channel: 'chrome'` and `channel: 'msedge'`, so each drives the real product. Without a channel, `Desktop Chrome` and `Desktop Edge` both resolve to Playwright's bundled Chromium, and two of the three results would be the same engine under different names. Firefox needs no channel: the bundled build is Firefox. The branded browsers are a separate install (`npx playwright install chrome msedge`); on CT the job runs inside `mcr.microsoft.com/playwright`, which already carries the bundled ones and their system libraries, and adds those two on top.

## Custom fixtures

`fixtures/fixture.ts` extends `@playwright/test`'s own `test` with five fixtures:

- `strategy: IInteractionStrategy` — Playwright's own `page` fixture wrapped with `InteractionStrategyFactory.playwright` from [`@gitea-automation/core-page-objects`](../../core/page-objects/README.md).
- `clients` — the 7 Gitea API clients (`organizations`, `repositories`, `issues`, `labels`, `teams`, `milestones`, `users`), each built via `RequestStrategyFactory.playwright` from [`@gitea-automation/core-api-client`](../../core/api-client/README.md), sharing one `PlaywrightRequestStrategy` instance — plus `auth: AuthClient`, which stays `got`-based (see that package's README for why it's out of the Strategy pattern).
- `pageObjects: PageFactory` — [`@gitea-automation/business-logic/pages/page.factory.ts`](../../business-logic/README.md), built from `strategy` and `scenarioState`.
- `scenarioState: ScenarioState` — starts as `{}` per test, same type the other two suites use.
- `sessionManager` — `loginAs(username, password)`, `loginAsOwner()`, `logout()`. A test says who to log in as, not how — the same shape as `gitea-selenium-vitest`'s `sessionManager` fixture. Underneath, `fixtures/session.util.ts`'s `applySession`/`clearSession` do the same cookie dance `gitea-selenium-vitest`'s `session.util.ts` does for a `WebDriver` (`AuthClient.loginViaApi` → clear cookies → set the returned ones → reload), just through `BrowserContext.addCookies`/`clearCookies` instead of `driver.manage()`.

```ts
import { test, expect } from "../fixtures/fixture";

test("...", async ({ sessionManager, pageObjects, scenarioState }) => {
  await sessionManager.loginAsOwner();
});
```

## Running it

```bash
npm test -w @gitea-automation/playwright-native
```

runs the functional specs on all three browsers in one process. It names the three browser projects rather than running every project, so the non-functional scans described at the end of this README stay out of it. Browser binaries are installed separately, not as part of `npm install`:

```bash
npx playwright install firefox        # the bundled build
npx playwright install chrome msedge  # the real products the branded projects drive
```

Point the suite somewhere with `GITEA_BASE_URL`, for example `GITEA_BASE_URL=http://localhost:3000 npm test -w @gitea-automation/playwright-native`.

For one OS process per browser — the same isolation `gitea-selenium-vitest`/`gitea-selenium-cucumber` use so that two browsers never contend for the same Gitea account:

```bash
npm run test:chrome -w @gitea-automation/playwright-native
npm run test:firefox -w @gitea-automation/playwright-native
npm run test:edge -w @gitea-automation/playwright-native
npm run test:parallel -w @gitea-automation/playwright-native   # the three above, concurrently
```

`fixtures/credentials.ts`'s `resolveOwnerCredentials`/`resolveOwnerToken` pick a browser-specific Gitea account, but not from an env var: `npm test` runs all three projects in one worker process, where an env var can't vary per project. They take the project name as a parameter instead, sourced from Playwright's own `testInfo.project.name` — the same convention whether a test runs standalone (`test:chrome`), as part of `test:parallel`, or all three together via plain `npm test`.

To watch the browsers instead of running headless, add `:headed` (sets `HEADED=1`, which `playwright.config.ts` reads to turn `headless` off):

```bash
npm run test:headed -w @gitea-automation/playwright-native            # all three, one process
npm run test:parallel:headed -w @gitea-automation/playwright-native   # all three, one window each, in parallel
```

or pass `--headed` directly to any single-browser script, e.g. `npm run test:chrome -w @gitea-automation/playwright-native -- --headed`.

## UI tests

`login-api.spec.ts` proves the `clients` fixture end to end (`PlaywrightRequestStrategy`, real HTTP against the local Gitea instance) and drives real browser state via `context.addCookies` — but it asserts through Playwright's own `page`/`expect`, not through `pageObjects`.

`login-ui.spec.ts` drives a real login the same way the Selenium suites do: `pageObjects.loginPage.open()`/`.login(...)`, asserted through `pageObjects.mainPage.hasExpectedElementsDisplayed()`/`navBar.getCurrentOrganization()`. `PlaywrightInteractionStrategy` (see [`@gitea-automation/core-page-objects`](../../core/page-objects/README.md)) is fully implemented, so any existing Selenium-driven page-object flow can be exercised here without touching a page object — porting more of the Selenium suites' scenarios to this service is a separate, later stage.

`project-board-drag-and-drop.spec.ts` replicates the Cucumber suite's project-board drag-and-drop smoke (`project-board.feature`'s "A card dragged onto another column is kept there by the board"): it creates a Basic Kanban project and assigns both seeded issues to it through `pageObjects`, then moves the first card into "In Progress" with `pageObjects.projectBoardPage.moveCard(issueId, columnTitle)` — the same, unmodified method the Selenium suites use. It passes on all three browsers: the manual mouse drag lands directly on chrome and edge, and `moveCard`'s own fallback to `dispatchDragEvents` (now a real native-event-dispatch implementation, see the core-page-objects README's "Playwright strategy notes") reliably recovers it on firefox.

## Hooks fixtures

`fixtures/hooks-fixtures.ts` is where a test's precondition/postcondition setup lives, instead of a `try`/`finally` in the test body: Playwright tears a fixture's setup down (the code after `use()`) even when the test fails, so no manual cleanup handling is needed in the test itself. It extends `fixtures/fixture.ts`'s own `test`, the same way `fixture.ts` extends `@playwright/test`'s.

Each fixture here is paired with a tag a test opts into with `{ tag }` — the same idea as the Cucumber suite's own `Before({ tags: ... })` hooks in `hooks.ts`, so a fixture's precondition only runs for a test that actually declared it needs it:

- `PROJECT_BOARD_TAG` (`"@project-board"`, mirroring `project-board.feature`'s own tag) pairs with the `seededOrganizationWithRepositories` fixture — one organization, two repositories, one issue in each, torn down after the test.

```ts
import { test, expect, PROJECT_BOARD_TAG } from "../fixtures/hooks-fixtures";

test("...", { tag: PROJECT_BOARD_TAG }, async ({ seededOrganizationWithRepositories }) => {
  const { organizationName, repositories } = seededOrganizationWithRepositories;
});
```

A test can filter to just this tag the same way Cucumber does with `--tags`: `npx playwright test --grep "@project-board"`.

## Accessibility scans

`tests/non-functional/accessibility/` scans the login form, the user dashboard and organization creation with [`@axe-core/playwright`](https://playwright.dev/docs/accessibility-testing), on the `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa` rule tags. `fixtures/axe.fixture.ts` holds those tags and two fixtures, `makeAxeBuilder()` and `publishScan()`, and extends `fixtures/fixture.ts` so a scan signs in through `sessionManager`.

They are not part of `npm test`. Each non-functional area gets its own projects, derived in `playwright.config.ts` from the same browser list the functional ones use:

| Project                                     | Runs                                                        |
| ------------------------------------------- | ----------------------------------------------------------- |
| `chrome`, `firefox`, `edge`                 | everything but `tests/non-functional/`                      |
| `accessibility-chromium`                    | `tests/non-functional/accessibility/` only, without retries |
| `accessibility-chrome`, `-firefox`, `-edge` | the same scans, on demand                                   |

A scan runs on bundled Chromium, which every Playwright install carries, so the accessibility workflow installs no browser. The branded projects are defined for the same scans and share the same baselines: axe evaluates the DOM, so all four agree, and a divergence is worth seeing rather than worth assuming.

```bash
npm run test:a11y -w @gitea-automation/playwright-native          # scan on Chromium
npm run test:a11y:all -w @gitea-automation/playwright-native      # and on the three branded ones
npm run report:a11y -w @gitea-automation/playwright-native        # read the result
npm run test:a11y:update -w @gitea-automation/playwright-native   # re-record the baselines
```

### Output

Everything below is git-ignored and uploaded as the `accessibility-scans` artifact.

In `reports/accessibility/`:

- `summary.html`, one self-contained page: the counts per `impact`, then a card per rule with its offending elements. `report:a11y` writes it and prints the same counts for a pull request description.
- `<page>-<browser>.json`, the full axe result, also attached to the test so Allure carries it.

In `test-results/`, only for a scan that failed:

- `trace.zip`, a Playwright trace of the run. It carries a DOM snapshot per action, so the element a violation names can be selected and read with its computed style instead of being reproduced by hand from a selector and two hex colours. A scan that passed leaves none: the accessibility projects set `trace: "retain-on-failure"`, since the suite-wide `on-first-retry` never fires on projects configured with no retries. It opens with no network connection, and under this path rather than the repository root:

```bash
npx playwright show-trace test-results/<test-directory>/trace.zip
```

In `playwright-report/`, the stock Playwright report:

- `index.html` and the `data/` and `trace/` folders beside it. Unlike the other two it is not one page: attachments land in `data/` under a content hash, and once a trace exists Playwright bundles its own viewer into `trace/`, which is how the report opens a trace without reaching `trace.playwright.dev`. Keep the folder whole or the report loses its attachments.

### Reading one run three ways

Every report below describes the same run. They answer different questions, which is why all three are published.

| Report                               | Answers                                                                      | Shape              |
| ------------------------------------ | ---------------------------------------------------------------------------- | ------------------ |
| `reports/accessibility/summary.html` | How many violations, at what `impact`, on which page                         | One page, ~20 KB   |
| `allure-report/index.html`           | Did the suite pass, which step failed, grouped by suite and kept across runs | One page, ~11 MB   |
| `playwright-report/index.html`       | The same verdict, with the trace viewer bundled for offline use              | A folder, 28 files |

Only `summary.html` answers the severity question, because only it reads inside the axe result. Allure's own `severity` is a label on a test, one per page, while `impact` belongs to each violation.

### Baselines

A scan asserts a sorted `rule<tab>target` fingerprint against `tests/non-functional/accessibility/baselines/`, so it fails on a violation the baseline does not record rather than on the ones the application already has. One baseline per page, shared by the three browsers.

A baseline only matches the application it was recorded against, so record it against a disposable Gitea seeded the way `.gitea/workflows/accessibility.yml` seeds one:

```bash
docker network create a11y-net
docker run -d --name gitea-test --network a11y-net \
  -e GITEA__server__ROOT_URL=http://gitea-test:3000/ \
  -e GITEA__security__INSTALL_LOCK=true \
  -e GITEA__service__DISABLE_REGISTRATION=false \
  -e GITEA__service__REGISTER_EMAIL_CONFIRM=false \
  docker.gitea.com/gitea:1.27.3
```

Register one owner account per browser project you intend to run, named `<browser>-owner`, as that workflow's seeding step does: `chromium-owner` for `test:a11y`, plus `chrome-owner`, `firefox-owner` and `edge-owner` for `test:a11y:all`. Register one throwaway account before them, since Gitea makes the first user of an instance an administrator. Then export `GITEA_BASE_URL` and the matching `GITEA_OWNER_*`/`GITEA_TOKEN_*` variables and run `test:a11y:update` inside `mcr.microsoft.com/playwright:v1.63.0-noble` on that network. Commit regenerated baselines on their own, never with code changes.
