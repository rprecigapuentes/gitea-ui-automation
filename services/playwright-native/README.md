# playwright-native

UI automation against Gitea with Playwright's native test runner (`@playwright/test`), as part of the `gitea-ui-automation` monorepo. A smoke suite today: it drives the application under test on real Chrome, Firefox and Edge, and runs nightly on CT alongside the Selenium suites.

## What's here

- `tests/gitea-smoke.spec.ts` — asserts the Gitea at `baseURL` serves its landing page and the sign-up form, on every browser in the matrix. `playwright.config.ts` reads that URL from `GITEA_BASE_URL`, falling back to `http://localhost:3000`, so the suite points at whatever instance you give it. Nothing here logs in; account-level flows wait on the page objects described at the end of this README.
- `allurerc.js` and the `allure-playwright` reporter, the same Allure 3 setup the Selenium suites use. `npm run report` turns `allure-results/` into a single-file `allure-report/index.html`, and each result carries the project it ran on, so a failure names its browser without opening the job log. The stock `html` reporter runs alongside it and writes `playwright-report/<browser>/` during the run, with no generation step of its own.
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

runs the functional specs on all three browsers at once, as three OS processes with one worker each (it is `test:parallel` under its plain name, and it is what the CT pipeline runs). It names the three browser projects rather than running every project, so the non-functional scans described at the end of this README stay out of it. Browser binaries are installed separately, not as part of `npm install`:

```bash
npx playwright install firefox        # the bundled build
npx playwright install chrome msedge  # the real products the branded projects drive
```

Point the suite somewhere with `GITEA_BASE_URL`, for example `GITEA_BASE_URL=http://localhost:3000 npm test -w @gitea-automation/playwright-native`.

One OS process per browser is the same isolation `gitea-selenium-vitest`/`gitea-selenium-cucumber` use so that two browsers never contend for the same Gitea account. Each script sets `BROWSER`, which `playwright.config.ts` uses to give the process its own `reports/junit-<browser>.xml`, `test-results/<browser>/` and `playwright-report/<browser>/`, so the three never clear or overwrite one another's output:

```bash
npm run test:chrome -w @gitea-automation/playwright-native
npm run test:firefox -w @gitea-automation/playwright-native
npm run test:edge -w @gitea-automation/playwright-native
npm run test:parallel -w @gitea-automation/playwright-native   # the three above, concurrently
```

`fixtures/credentials.ts`'s `resolveOwnerCredentials`/`resolveOwnerToken` pick a browser-specific Gitea account, but not from an env var: `test:headed` runs all three projects in one worker process, where an env var can't vary per project. They take the project name as a parameter instead, sourced from Playwright's own `testInfo.project.name` — the same convention whether a test runs standalone (`test:chrome`), as part of `test:parallel`, or all three together in one process via `test:headed`.

`resolveInvitedCredentials` does the same for the invited account (`GITEA_INV_<BROWSER>`, the accounts the Selenium suites already use). A project named `chromium`, the bundled build the accessibility scans run on, has no account of its own, so all three resolvers read the Chrome one.

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

`project-board.spec.ts` replicates the four remaining scenarios of that same feature file, so the board smoke (`S2-SMK-ISS`) now runs whole on both runners:

| `project-board.feature` scenario                                             | Playwright spec                       |
| ---------------------------------------------------------------------------- | ------------------------------------- |
| The Basic Kanban template lays the board out                                 | `project-board.spec.ts`               |
| An issue added to the project lands in the default column                    | `project-board.spec.ts`               |
| A column added from the board appears on it                                  | `project-board.spec.ts`               |
| A card dragged onto another column is kept there by the board                | `project-board-drag-and-drop.spec.ts` |
| The default column cannot be deleted and takes in the cards of a deleted one | `project-board.spec.ts`               |

Porting them turned up one race in `ProjectBoardPage.addColumn`, which returned while the request that creates the column was still in flight, so the next navigation aborted it. It now waits for the column to reach the board, the same way `moveCard` waits for the state the server kept. Selenium never saw it because a driver round trip is slower than the in-process call that replaced it.

`organizations-e2e.spec.ts` holds the two end-to-end organization scenarios, each marked with a one-line comment naming which suite it replicates:

- `// Vitest` — "should create an organization and add members" replicates `gitea-selenium-vitest`'s `organizations.test.ts`: the owner creates an organization and two private teams, adds the invited user to the first, removes them and reviews the persisted Teams state. It calls the same page-object methods with the same assertions, only through `pageObjects` instead of one fixture per page, and `test.step` takes the place of Allure's `step`.
- `// Cucumber` — "Change team members permissions" replicates the `@e2e` scenario of `gitea-selenium-cucumber`'s `organizations.feature`: the owner creates an organization, two teams, their members, a repository and files, then user 1 and user 2 write, read and lose access as the owner changes the teams.

Both run on the three browsers like every other spec.

`organizations-smokes.spec.ts` replicates the five smokes of the same feature, one test each and in the same order: create an organization, create a team, add a user to a team, create a repository, add a repository to a team. They call the same page-object methods and assert the same things through `pageObjects`. Where the feature adds a seeded user to the team, the test adds the browser's invited account, since the job has no admin token to seed users with.

`issue-metadata.spec.ts` and `scoped-labels.spec.ts` are the Playwright side of `AT-ISS-01` and `AT-ISS-02`, replicated from `gitea-selenium-vitest/tests/issue-metadata.test.ts` and `tests/issues.test.ts` for the week 3 comparison, with no assertion dropped. `AT-ISS-01` creates an issue carrying a Markdown description, a label, a milestone and an assignee, checks both list filters return it, and checks that closing it drives its milestone to 100 percent. `AT-ISS-02` creates three scoped labels through the UI and checks that a scoped label replaces the one of its own scope, coexists with another scope, and leaves the issue when removed.

Two differences from their Vitest originals, both forced by the runner rather than chosen. Where the Vitest tests navigate with `driver.get(page.getUrl(...))`, these call the page object's own `openFor(...)`, which also waits for that view's ready locators. And both sign in with an explicit `sessionManager.loginAsOwner()`, because the Vitest suite logs in through an automatic `loggedInSession` fixture that this service has no counterpart to.

`demo-e2e.spec.ts` replicates the `@e2e` scenario of `gitea-selenium-cucumber`'s `demo-e2e.feature`, the one case that crosses every area at once. It is one test with a `test.step` per phase of the feature file, because every phase depends on the state the last one left: the owner creates a team, a repository joins it and nobody can be assigned from it yet, a user joins and the assignee list answers, a scoped label and an issue carrying its metadata are created, a Basic Kanban project takes in the three issues, a column is added, the cards are dragged, the column is deleted and its cards fall back to the default one, the issue is closed and reopened against its milestone, and the member signs in to the same work without the owner's actions. The Kanban project is created in the test where the feature file creates it, halfway through, rather than through the `kanbanProject` fixture, because a fixture runs before the body and the order is part of what the scenario asserts.

Porting it turned up one disagreement between the two strategies, in `ProjectColumnFragment.openMenu`. It clicked a column's dropdown trigger once and confirmed nothing, which held on Selenium, where `findElement` polls for visibility, and did not on Playwright, where it returns a lazy locator and waits for nothing. The column the test adds is the fifth and sits outside the viewport, and the first click on a trigger the board had to scroll into view is swallowed: the menu stayed closed while its items stayed in the DOM without a box, so the later click on the delete item waited out the whole test timeout, two calls below the cause. It now clicks until the menu is open.

## Seed fixtures

`fixtures/issues-fixtures.ts` holds the API-seeded state those two specs start from, the Playwright form of the Vitest fixtures of the same names: `owner`, `repository`, `issue`, `maintainer`, `classificationLabel` and `milestone`. They build on the `clients` fixture rather than on their own HTTP, and only `repository` cleans up, because deleting it takes its issues, labels and milestones with it.

`owner` and `repository` derive the browser from `testInfo.project.name`, where the Vitest fixtures read `process.env.BROWSER`: accounts are per browser, and the project name is what a Playwright fixture has.

## Project board fixtures

`fixtures/project-board-fixtures.ts` holds what `project-board.feature`'s `Background` gives its scenarios, as three fixtures that extend `fixtures/organizations-fixtures.ts`:

- `seededOrganizationWithRepositories` — one organization, two repositories, one issue in each, all torn down after the test.
- `seededMilestone` — `demo-e2e.feature`'s own `Before` hook: a milestone on the seeded organization's first repository, due in seven days, which the demo case closes an issue against. Deleting the repository takes it with it.
- `kanbanProject` — the owner's session and the project created from the Basic Kanban template, handed to the test as its id and title. It asks for the fixture above, so a test that wants the project gets the organization too, and it undoes nothing itself because deleting the organization takes the project with it.

```ts
import { test, expect } from "../fixtures/project-board-fixtures";

test("...", async ({ seededOrganizationWithRepositories, kanbanProject }) => {
  const { organizationName, repositories } = seededOrganizationWithRepositories;
});
```

A fixture's precondition runs only for a test that names it in its signature, and its postcondition runs even when that test fails, which is what replaces a `try`/`finally` in the test body. A seed that belongs to one area lives in that area's file and extends the one below it, the way `issues-fixtures.ts` does; `fixture.ts` stays the transversal one.

## Organizations fixtures

`fixtures/organizations-fixtures.ts` holds what the organization smokes and the `@e2e` scenario of `organizations.feature` start from, extending `fixtures/fixture.ts`:

- `existingOrganization` — "an organization already exists" in the Cucumber smokes: a public organization created through the API and recorded in `scenarioState`, so `cleanupCreatedOrganization` removes it.
- `seededUsers` — the Cucumber suite's `createSeededUsers`: two users, "user 1" and "user 2", created through the admin API before the test and deleted after it, named per browser so the three browsers never share one. It needs `GITEA_ADMIN_TOKEN`, one token shared by the three browsers, and the `ct-functional.yml` job mints it.
- `seededOrganizationWithTeamAndRepository` — one organization with a `team-1` team and a `frontend` repository, mirroring the Cucumber hook behind its own `@team-repository` tag. `cleanupCreatedOrganization` removes it.

`SMOKE_TAG` (`"@smoke"`), `TEAM_REPOSITORY_TAG` (`"@team-repository"`) and `E2E_TAG` (`"@e2e"`) mirror the Cucumber suite's own tags of those names. `ORGANIZATION_TAG` and `ORGANIZATION_NAME_PREFIX` are read by `cleanupOrganizationsBeforeRun` below, so they live in `fixture.ts` next to it; this file re-exports them, so a spec still needs one import.

## Cleanup fixtures

The two cleanups are automatic (`{ auto: true }`) and live in `fixtures/fixture.ts`, because they apply to any test that creates an organization rather than to one area:

- `cleanupCreatedOrganization` — a test that creates an organization records it in `scenarioState.organization`; afterwards, whether it passed or failed, the fixture deletes the repositories the organization holds and then the organization, because Gitea refuses to delete one that still owns a repository. The visual specs rely on it.
- `cleanupOrganizationsBeforeRun` — the counterpart of the Vitest suite's fixture of that name: for a test carrying `ORGANIZATION_TAG`, it removes the organizations a crashed run left behind. Being automatic, it runs for every test, so the tag is how it picks the ones it applies to; it only removes names under `ORGANIZATION_NAME_PREFIX`, so a parallel worker's organizations are never touched, where the Vitest one clears every organization of the account.

## Accessibility scans

`tests/non-functional/accessibility/` scans the login form, the user dashboard and organization creation with [`@axe-core/playwright`](https://playwright.dev/docs/accessibility-testing), on the `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa` rule tags. `fixtures/axe.fixture.ts` holds those tags and two fixtures, `makeAxeBuilder()` and `publishScan()`, and extends `fixtures/fixture.ts` so a scan signs in through `sessionManager`.

They are not part of `npm test`. Each non-functional area gets its own projects, derived in `playwright.config.ts` from the same browser list the functional ones use:

| Project                                     | Runs                                                           |
| ------------------------------------------- | -------------------------------------------------------------- |
| `chrome`, `firefox`, `edge`                 | everything but `tests/non-functional/`                         |
| `accessibility-chromium`                    | `tests/non-functional/accessibility/` only, without retries    |
| `accessibility-chrome`, `-firefox`, `-edge` | the same scans, on demand                                      |
| `visual-chrome`, `-firefox`, `-edge`        | `tests/non-functional/visual/` only, without retries           |
| `performance-chromium`                      | `tests/non-functional/performance/` only, one worker, no trace |

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

- `summary.html`, one self-contained page: the counts per `impact`, then a card per rule with its WCAG success criteria and its offending elements. `report:a11y` writes it and prints the same counts for a pull request description.
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
| `reports/accessibility/summary.html` | How many violations, at what `impact`, against which WCAG criterion          | One page, ~20 KB   |
| `allure-report/index.html`           | Did the suite pass, which step failed, grouped by suite and kept across runs | One page, ~11 MB   |
| `playwright-report/index.html`       | The same verdict, with the trace viewer bundled for offline use              | A folder, 28 files |

Only `summary.html` answers the severity question, because only it reads inside the axe result. Allure's own `severity` is a label on a test, one per page, while `impact` belongs to each violation.

### The WCAG reading

Each axe rule declares the success criteria it tests as tags, so every card names them with their conformance level (`WCAG 4.1.2 · Level A`) instead of the rule id alone, and one tile counts the criteria that failed.

That is a reading of the findings against the standard, never a conformance claim: the criteria no rule reaches are unevaluated rather than met, and most of them are the ones only a person can decide. A conformance claim is written by hand, in the [WCAG-EM Report Tool](https://www.w3.org/WAI/eval/report-tool/).

### Baselines

A scan asserts a sorted `rule<tab>target` fingerprint against `tests/non-functional/accessibility/baselines/`, so it fails on a violation the baseline does not record rather than on the ones the application already has. One baseline per page, shared by the three browsers.

A baseline only matches the application it was recorded against, so record it against a disposable Gitea seeded the way the `accessibility` job of `.gitea/workflows/ct-non-functional.yml` seeds one:

```bash
docker network create a11y-net
docker run -d --name gitea-test --network a11y-net \
  -e GITEA__server__ROOT_URL=http://gitea-test:3000/ \
  -e GITEA__security__INSTALL_LOCK=true \
  -e GITEA__service__DISABLE_REGISTRATION=false \
  -e GITEA__service__REGISTER_EMAIL_CONFIRM=false \
  docker.gitea.com/gitea:1.27.3
```

Register one owner account per browser project you intend to run, named `<browser>-owner`, as that workflow's seeding step does: `chrome-owner` covers `test:a11y`, since the bundled Chromium project resolves to the Chrome account, and `firefox-owner` and `edge-owner` are needed on top for `test:a11y:all`. Register one throwaway account before them, since Gitea makes the first user of an instance an administrator. Then export `GITEA_BASE_URL` and the matching `GITEA_OWNER_*`/`GITEA_TOKEN_*` variables and run `test:a11y:update` inside `mcr.microsoft.com/playwright:v1.63.0-noble` on that network. Commit regenerated baselines on their own, never with code changes.

## Visual testing

`tests/non-functional/visual/` checks how views look, not what they do. Each spec walks a few views and compares every one with a recorded screenshot through Playwright's `toHaveScreenshot`. It is the second non-functional area, next to the accessibility scans, and like them it stays out of `npm test`.

```
tests/non-functional/visual/
├── authentication/main-view.spec.ts        # the main view as the owner and as the invited account, one baseline
├── organizations/                          # create an organization, create a team, browse repositories and members
├── issues/                                 # the issue list and an issue; the issue form, labels and milestones
├── project-board/project-board.spec.ts     # the project form, the project list, the board with its cards
└── baselines/<project>/<platform>/<view>.png
```

### The visual tester

`VisualTester` lives in [`@gitea-automation/core-playwright`](../../core/playwright/README.md), outside the page-object layer: a screenshot comparison has no Selenium equivalent, so it is not something a page object can own. `fixtures/visual.fixture.ts` extends `fixtures/fixture.ts` and hands a spec a `visualTester`:

```ts
import { test } from "../../../../fixtures/visual.fixture";

test("...", async ({ page, pageObjects, visualTester }) => {
  await pageObjects.issueListPage.openFor(owner, repository);
  await visualTester.verifyPage(page, "issue-list.png", {
    mask: pageObjects.issueListPage.getVolatileRegions(),
  });
});
```

- `verifyPage(page, name, { mask })` and `verifyComponent(locator, name, { mask })` are **soft** assertions: a mismatch is recorded and the test carries on with its next step, then fails when it ends. A spec that checks five views reports all five.
- `name` carries its extension. Baselines of every spec share one folder per project and platform, so a name identifies its view, is unique across the suite and starts with its area (`organization-`, `issue-`, `project-board-`).
- **Masks** paint a region over before comparing. The fixture masks the footer for every check, since Gitea prints `Page: Nms Template: Nms` there and it changes on each load. Regions of one view come from its page object: `BasePage.getVolatileRegions()` returns `string[]`, empty by default, and a page overrides it as runs show what varies. Gitea prints its relative times ("Updated now", "opened 2 hours ago") inside a `<relative-time>` element, which is the usual suspect.
- The main-view smoke carries no masks on purpose. It checks one baseline as two accounts, so it fails until the regions that belong to an account (the names and avatars, the contribution heatmap and feed, the repository lists) are masked.

### Writing a spec

- Create the state a view needs through `clients.*`, in the test body, and open the view through its page object. Use the interface only where no client exists (the project board) or where the state is the view being checked (a filled form).
- Name what you create per project, `at-vis-<area>-${testInfo.project.name}`, not at random: the three browsers run in parallel against one Gitea, and a fixed name renders the same text on every run.
- Put the organization in `scenarioState.organization` right after creating it, so `cleanupCreatedOrganization` removes it even if a later step fails.

### Projects and running

`visual-chrome`, `visual-firefox` and `visual-edge` come from the same browser list as the functional projects, so a browser is added in one place. Each browser runs its specs one after another with its own accounts, and the browsers run in parallel: `scripts/visual.mjs` starts one Playwright process per browser with `--workers=1`, which is what `test:parallel` does for the functional suite, and merges their blob reports into one native HTML report.

```bash
npm run test:visual -w @gitea-automation/playwright-native          # the three browsers, then opens one report
npm run test:visual:chrome -w @gitea-automation/playwright-native   # one browser (also :firefox, :edge)
npm run test:visual:update -w @gitea-automation/playwright-native   # record the baselines of all three
```

The report opens itself when the run ends, pass or fail; set `PLAYWRIGHT_HTML_OPEN=never` to skip that and open it later with `npx playwright show-report`. A failing check shows its expected, actual and diff images.

The specs need an owner and an invited account per browser (`GITEA_OWNER_<BROWSER>` and `GITEA_INV_<BROWSER>`, each with `_PASSWORD`) and the owner's `GITEA_TOKEN_<BROWSER>`. The token needs `write:user`, `write:repository`, `write:issue` and `write:organization`. The API client does not check the HTTP status, so a token missing a scope does not fail the call that needed it: the specs fail later, on a page that never renders.

Three more scripts exist for the workflow, which runs one process: `test:visual:ci` compares and writes the report without opening it, `test:visual:ci:missing` records only the baselines that do not exist, and `test:visual:ci:update` rewrites all of them.

### Baselines

A screenshot is pixel-exact for one browser on one platform, so baselines are stored as `baselines/<project>/<platform>/<view>.png`. `win32/` is what you record on a Windows workstation and `linux/` is what the workflow's runner renders; neither is ever compared on the other. Commit a regenerated baseline on its own, never together with code changes, and only after looking at it.

### Workflow

The `visual` job of `.gitea/workflows/ct-non-functional.yml` runs the suite against a disposable Gitea:

1. `baselines` runs the suite with `--update-snapshots=missing`. Playwright writes a baseline that does not exist and leaves the others alone, but it also fails the test that lacked one, so the job decides by fingerprinting the baseline folder before and after: if a file was written, the job uploads `visual-baselines-linux` and succeeds. If nothing was written, this job's run is the verdict and it uploads `playwright-report-visual`.
2. `visual` runs only when the first recorded something. It downloads those baselines over the committed ones, compares, and uploads `playwright-report-visual`. When nothing was missing it does not run, and Gitea shows it as skipped.

A dispatch with `record_baselines`, or a commit message carrying `[record-baselines]`, rewrites every baseline, which is what an intentional change to the interface needs.

The workflow commits nothing. A view whose baseline was recorded in a run is compared with that same recording, which shows it renders stably but not that it has not regressed; regressions are caught once a person commits `visual-baselines-linux`. Like the accessibility scans and the measurements it runs on `ct-non-functional.yml`, never on `ct-functional.yml`, so its duration never lands in the functional suites' path.

## Performance metrics

`tests/non-functional/performance/` measures what it costs to arrive at a page the suite already automates: the phases of the navigation, the first and largest contentful paint, the count and transferred weight of the resources, and the engine's own script, layout and style time. It answers how long one page takes for one user, not how many users the application holds; there is no load testing here and no separate tool.

`fixtures/performance.fixture.ts` exposes three fixtures and extends `fixtures/fixture.ts`, so a measurement signs in through `sessionManager` and navigates through the page objects the functional tests use.

### Writing a spec

```ts
const measurement = await performanceCollector.measure("dashboard", () =>
  pageObjects.mainPage.open(),
);
expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);

await publishMeasurement(measurement);
await verifyAgainstBaseline(measurement);
```

Three rules, all of which the shape above already follows:

1. **The navigation is the page object's own `open`, passed as a callback.** The collector loads the page several times and must not reach past the page object to do it, so it is handed the navigation rather than a URL. Every load then waits for that view's ready locators, which is the point the framework already treats as the page being ready.
2. **The measurement is taken after the session, never during it.** `sessionManager.loginAsOwner()` ends by navigating to the base URL. A figure read before the page object opens the page describes that navigation, not the page under test, and would be identical for every signed-in page.
3. **The spec is named for its page.** The two artifacts of a run are named from the spec's file name, because the network recording starts before the test says which page it measures.

### What one run produces

A page is loaded `LOADS` times, five today, and each load is measured twice: once with the browser cache cleared and once straight after, so a cold arrival and a warm reload stay separate figures. Every metric is published as a median with the minimum, maximum and the samples behind it: on a shared machine the spread is what says whether the median means anything.

Two files per page land in `reports/performance/`, both named `<page>-<browser>`:

- `<page>-<browser>.json` — every metric, cold and warm, with its spread. Also attached to the test result, so Allure carries it.
- `<page>-<browser>.har` — the network exchange, recorded without response bodies. Drag it into a browser's network panel for the waterfall, the status codes and the cache and compression headers, none of which the resource timings report.

They are written to `reports/` rather than the test's output directory because Playwright removes that directory when a test passes, after the context has written the HAR into it.

`report:perf` turns both into `summary.html` beside them, one self-contained page of about 8 KB that opens without a network. It carries three things, in the order they are asked about:

1. **Tiles** — the slowest page, the heaviest page, and how many requests returned an error, never completed, or came back uncompressed.
2. **Findings** — a card per kind of defect the recording exposes, across every page that shows it, because a kind is the unit a bug report is written against. One page's instance of it is an example, not a finding. This is the part the timings cannot produce at all.
3. **Per page** — one row per page, so they can be compared side by side, carrying the eight figures worth acting on. A figure past its band is amber, and every one names its band on hover. The metrics left out stay in the JSON: DNS and connection are zero against a local instance, and layout is under two milliseconds.

The waterfall itself stays in the `.har`; the summary reads its facts, not its timeline.

Allure and the stock Playwright report also run, as they do for every suite, but neither renders the figures: they report pass or fail per page and carry the JSON as an attachment.

```bash
npm run test:perf -w @gitea-automation/playwright-native
npm run report:perf -w @gitea-automation/playwright-native   # read the result
```

### Bands

A timing differs on every run, so a measurement is judged against a band rather than an exact figure. `tests/non-functional/performance/baselines/<page>.json` records an upper bound per metric, taken as a multiple of the median observed when it was recorded and never below a floor: doubling a 2 ms time to first byte is noise on a busy machine, and a band of 4 ms would report it as a regression. Request count and transferred weight get a tight multiple, since they do not drift; the engine counters and the largest paint get no band at all, because they explain a figure rather than decide it.

A page with no band has one written by the run and the run fails, so a missing band is never a silent pass. Delete the file and run again to re-approve one.

**A band belongs to the machine that recorded it.** A workstation is faster than the workflow's runner, so a band recorded here sits below what the runner reaches and fails every run. The committed bands are the runner's: a run that recorded one publishes it as `performance-baselines-linux`, and a person downloads that artifact into `tests/non-functional/performance/baselines/` and commits it after reading it.

### Workflow

The `performance` job of `.gitea/workflows/ct-non-functional.yml` runs the suite against a disposable Gitea and publishes `performance-metrics`: the JSON, the recordings and the Allure report, whether the run held its bands or left them. It is the last job in the chain, so nothing else on that workflow occupies the runner while it measures. Nothing stops `ct-functional.yml` from running at the same time, which is why this workflow's cron sits at 13:00, two hours after that one's, and why a dispatch belongs away from it: two measurements on one machine are not measurements.
