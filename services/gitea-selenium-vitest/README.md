# gitea-selenium-vitest

UI automation project using **Selenium WebDriver + TypeScript + Vitest**, supporting Chrome, Firefox and Edge. Part of the `gitea-ui-automation` monorepo — shared framework and Gitea domain code live in [`@gitea-automation/core`](../../core/README.md); see [`docs/PROJECT_CONTEXT.md`](../../docs/PROJECT_CONTEXT.md) at the repo root for the full picture.

## Prerequisites

- [Node.js](https://nodejs.org/) 22 (the version in the repo root `.nvmrc`, enforced by `engines`)
- Google Chrome installed
- Mozilla Firefox installed
- Microsoft Edge installed
- **Firefox must be available in your system PATH** (see setup below — this is a one-time step per machine)

> Browser drivers (chromedriver, geckodriver) are **not** installed manually.
> They are resolved automatically by [Selenium Manager](https://www.selenium.dev/documentation/selenium_manager/) the first time each test runs.

## One-time setup: add Firefox to PATH (Windows)

Chrome and Edge are added to the PATH automatically on install, but Firefox usually isn't. Without this step, Firefox tests will fail with a driver connection error.

### Option 1: GUI

1. Locate your Firefox install folder (usually `C:\Program Files\Mozilla Firefox`)
2. Press `Win + R`, type `sysdm.cpl`, press Enter
3. Go to **Advanced** tab → **Environment Variables**
4. Under **System variables**, select `Path` → **Edit**
5. Click **New** and add: `C:\Program Files\Mozilla Firefox`
6. Click OK on all windows
7. **Close and reopen your terminal** (required for the change to take effect)

### Option 2: PowerShell (as Administrator)

```powershell
[Environment]::SetEnvironmentVariable(
  "Path",
  [Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\Program Files\Mozilla Firefox",
  "Machine"
)
```

Close and reopen your terminal, then verify:

```powershell
where firefox
```

It should print the path to `firefox.exe`. If it doesn't, double-check your Firefox install location and adjust the path above accordingly.

## Installation

From the **repo root** (this project is part of an npm workspaces monorepo, it has no lockfile of its own):

```bash
npm install
```

## Login credentials

Create a local `.env` file in this folder (`services/gitea-selenium-vitest/.env`) from `.env.example`, then set your Gitea account credentials — one owner + one invited account per browser:

```dotenv
GITEA_BASE_URL=http://localhost:3000
GITEA_OWNER_CHROME=chrome-owner
GITEA_OWNER_CHROME_PASSWORD=...
GITEA_TOKEN_CHROME=...
# ...same pattern for FIREFOX and EDGE, plus GITEA_INV_<BROWSER>[_PASSWORD]
```

`GITEA_TOKEN_<BROWSER>` is a Gitea access token, generated at `/user/settings/applications` under **Manage Access Tokens** with Read and Write on user, repository, issue and organization. It belongs to the instance `GITEA_BASE_URL` points at, the application under test, and not to the instance that holds this repository. Every test calls the API before it touches the browser, so without the token the whole suite fails in `beforeEach` with a 401.

The `.env` file is ignored by Git and must not be committed.

## Running tests

From the repo root, the root scripts delegate to this workspace:

```bash
npm test                      # the three browsers, as Vitest projects in one process
npm run test:parallel         # the three browsers, as three genuinely concurrent OS processes
npm run test:chrome           # one browser only
npm run test:serial           # the same suite, one file at a time
HEADLESS=true npm test        # without three windows opening
MAX_WORKERS=1 npm test        # on a machine that cannot hold three browsers
```

Or from inside this folder, the same scripts without the `-w` delegation (`npm test`, `npm run test:chrome`, etc.).

Each browser is a Vitest project, so `npm test` drives Chrome, Firefox and Edge from a single Vitest process (one shared reporter, one combined `reports/junit.xml`). `npm run test:parallel` instead spawns `test:chrome`/`test:firefox`/`test:edge` as three separate, genuinely concurrent processes via `concurrently` — a stronger guarantee of real 3-way parallelism, at the cost of one JUnit file per browser (`reports/junit-chrome.xml`, `reports/junit-firefox.xml`, `reports/junit-edge.xml` — `vitest.config.ts` switches the output path based on whether `BROWSER` is set in the environment, which `test:chrome`/`test:firefox`/`test:edge` set via `cross-env`, and `test`/`npm test` do not). `npm run test:serial` runs the same suite one file at a time and must stay green: a suite that only passes in parallel, or only in serial, has a test depending on another.

By default, browsers run **visibly** (not headless), so you can watch the tests execute.

One Vitest worker holds one WebDriver session, because the driver is a singleton per process and Vitest gives each test file its own process. `MAX_WORKERS` is therefore browser capacity rather than CPU tuning: it must never exceed what the machine, or the grid on the other end, can serve. It defaults to 3.

## BrowserStack

The same suite can run against a browser on [BrowserStack Automate](https://automate.browserstack.com/) instead of a local one. BrowserStack is a hosted Selenium Grid, so it replaces the browser and nothing else: no test, page object or fixture changes.

Add the credentials from your [account profile](https://www.browserstack.com/accounts/profile/details) to this folder's `.env`, and point the suite at `bs-local.com` rather than `localhost`, because inside a remote browser `localhost` is the remote machine:

```dotenv
GITEA_BASE_URL=http://bs-local.com:3000
BROWSERSTACK_USERNAME=your-browserstack-username
BROWSERSTACK_ACCESS_KEY=your-browserstack-access-key
```

```bash
npm run test:browserstack     # every BrowserStack platform (from repo root)
npm test                      # unchanged: three local browsers, no plan minutes
```

`test:browserstack` is the only command that reaches the hub, and it starts and stops the BrowserStack Local tunnel itself. Each session is marked passed or failed on the Automate dashboard from the test results, rather than only recorded as having run.

A platform is one entry in `browserStackPlatforms` in `vitest.config.ts`. **Keep the `bs-` prefix**: the npm scripts select and exclude these projects with `--project=bs-*` and `--project=!bs-*`, so a platform named without it joins the default run and spends plan minutes on every `npm test`. `MAX_WORKERS` must not exceed the plan's parallel session limit, which is `parallel_sessions_max_allowed` here:

```bash
curl -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" https://api.browserstack.com/automate/plan.json
```

`.gitea/workflows/bs.yml` (repo root) runs the same suite on the pipeline, with the disposable Gitea as its only service container and no Selenium container, because the hub is the grid. It runs on manual dispatch and a weekly schedule only, so it never gates a merge and never spends minutes on a push. It needs `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` as repository secrets, under Settings, Actions, Secrets.

## Continuous testing

`.gitea/workflows/ct.yml` (repo root) is a second pipeline, separate from CI. It deploys a disposable
Gitea instance and a Selenium container as service containers, registers the first account,
mints an API token for it, and runs this suite against them.

Trigger it from the repository's Actions tab, on the CT workflow, with **Run workflow**.

It never runs on a push or a pull request, so it cannot block a merge. `ci.yml` at the repo root stays
quality only: install, format check, lint, typecheck — across the whole monorepo.

It also runs on a schedule, 06:00 on weekdays (server time, America/Bogota). A scheduled run
deploys the application, runs the three browsers in parallel in one job, and leaves a single
report artifact covering all three. It never gates a merge.

### Reports

Every run writes raw results to `allure-results/` (inside this folder). The pipeline turns them into an Allure
report and attaches it to the run as `allure-report`, kept for 14 days. A failed run still
produces one. Each test appears once per browser, told apart by a `browser` parameter.

The report is a single self-contained `index.html`: unpack the artifact and open it, no
server needed.

Locally:

```bash
npm test          # writes services/gitea-selenium-vitest/allure-results/
npm run report    # generates services/gitea-selenium-vitest/allure-report/
npm run report:open
```

`pretest` clears `allure-results/` before every run. Without that the directory accumulates
every run ever made, and results written before a change was made show up beside the current
ones as extra entries in the report.

Runs are independent, so the report shows no trend across runs. Allure history needs a file
carried between runs, and this runner has nowhere to keep one.

## Page object architecture

UI code follows a **Page / Fragment / Facade** split, all built on the shared `BaseComponent` from `@gitea-automation/core`:

- **`BaseComponent`** (`@gitea-automation/core/selenium/ui/base-pages/base-component`) — the `find`, `click` and `type`
  helpers shared by everything below. It has no notion of a URL.
- **`BasePage extends BaseComponent`** (`@gitea-automation/core/selenium/ui/base-pages/base.page`) — a page that owns a URL. Implements the `Navigable`
  interface (`getUrl()` + `open()`).
- **`Navigable`** — a standalone interface (`getUrl()` + `open()`), not a base class. Any
  object that represents a navigable URL implements it directly, so a facade that just
  orchestrates several already-navigable pages isn't forced to carry a `getUrl()` that
  wouldn't make sense for it.
- **Facades** (e.g. `OrganizationFacade`) — compose several fragments that together make up
  one navigable view (for example, a fixed tab-navigation fragment plus a content fragment
  that changes per tab). A facade implements `Navigable` and exposes high-level flow methods
  (`navigateToRepositoriesTab()`, `navigateToTeamsTab()`, …) instead of raw locators, hiding
  which fragment currently owns which piece of the screen.

The concrete page objects themselves (`LoginPage`, `IssuePage`, `OrganizationFacade`, fragments — with real Gitea selectors) live in `src/ui/pages/**` of **this** service, not in `core`. See [`core/README.md`](../../core/README.md) for why.

Tab-style navigation fragments expose a single `navigateToTab(tab: SomeTabEnum)` method
backed by an enum, rather than one method per tab, to avoid duplicating locator objects and
to keep tab selection type-safe.

File naming follows the same convention throughout: `*.page.ts`, `*.fragment.ts`,
`*.facade.ts`, grouped into `pages/`, `fragments/` and `facades/` folders per feature.

### Fixtures and stateful facades/fragments

When a page, fragment or facade depends on data that only exists once the test is running
(e.g. an organization created mid-test and stored in `scenarioState`), its fixture factory
must be:

- **Lazy** — a `() => T` function, not a plain value, since the dependency isn't available
  yet when the fixture itself is set up.
- **Memoized** — cached on first call (e.g. with `??=`), not re-constructed on every call.
  Facades and fragments can hold internal state (such as which tab is currently active); a
  fresh instance on every call silently loses that state between steps of the same test.

## Project structure

```
services/gitea-selenium-vitest/
├── vitest.config.ts                # Vitest projects (chrome/firefox/edge + bs-*), setupFiles/globalSetup point at ./config/*
├── allurerc.js / .env / .env.example
├── config/
│   ├── allure.config.ts            # tags the Allure "browser" parameter — Vitest beforeEach hook
│   └── browserstack.global-setup.ts # starts/stops the BrowserStack Local tunnel — Vitest globalSetup
├── src/
│   ├── entities/                   # fixture-orchestration types (BrowserStackSession, ScenarioState, SessionManager) — not Gitea API data, stay local
│   ├── fixtures/fixture.ts         # composition root: driver, pages, clients (from @gitea-automation/core), seeded data
│   ├── utils/                      # session.util (applies API-obtained cookies to the WebDriver session), session-credentials.util (per-browser multi-account resolution)
│   └── ui/pages/                   # page objects by feature — authentication/, common/, issues/, organizations/
└── tests/                          # specs: assertions only, import `test` from ../src/fixtures/fixture
```

Everything reusable by more than this project (the Selenium driver/base pages, the Gitea API clients/entities, logging, test-data naming) lives one level up, in [`@gitea-automation/core`](../../core/README.md).

## Troubleshooting

**`401` in `beforeEach`, before any browser opens**
`GITEA_TOKEN_<BROWSER>` is missing or expired in this folder's `.env`. See _Login credentials_ above.

**`SessionNotCreatedError: This version of ChromeDriver only supports Chrome version X`**
Selenium Manager has a stale cached driver. Clear its cache and re-run:

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.cache\selenium"
```

**`WebDriverError: Process unexpectedly closed with status 0` (Firefox)**
Firefox isn't reachable — usually means it's not in the PATH. Follow the setup steps above and confirm with `where firefox`.

**`Hook timed out in 30000ms`**
The first run can take longer while Selenium Manager downloads the matching driver. This is already handled via `hookTimeout: 60000` in `vitest.config.ts` — if it still times out, check your internet connection or re-run (the driver gets cached after the first successful download).

**Three browsers is too many for the machine**
Run `MAX_WORKERS=1 npm test`, or `npm run test:chrome` for a single browser.

**`BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY are required by the browserstack project`**
Locally, the two variables are missing from this folder's `.env`. On the pipeline, the repository secrets are not set, and Gitea expands a missing secret to an empty string rather than failing.

**A test involving a URL assertion right after a click is flaky (passes sometimes, fails others)**
The click likely triggers a server-side redirect that WebDriver doesn't wait for automatically — only the click itself is awaited, not the navigation it causes. Add an explicit wait after the click (`until.urlContains(...)` or `until.elementLocated(...)` for an element unique to the destination page) instead of asserting the URL immediately.
