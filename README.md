# Gitea UI Automation

UI automation project using **Selenium WebDriver + TypeScript + Vitest**, supporting Chrome, Firefox and Edge.

## Prerequisites

- [Node.js](https://nodejs.org/) 22 (the version in `.nvmrc`, enforced by `engines`)
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

```bash
npm install
```

## Login credentials

Create a local `.env` file from `.env.example`, then set your Gitea account credentials:

```dotenv
GITEA_USERNAME=your-username
GITEA_PASSWORD=your-password
GITEA_TOKEN=your-token
```

`GITEA_TOKEN` is a Gitea access token, generated at `/user/settings/applications` under **Manage Access Tokens** with Read and Write on user, repository, issue and organization. It belongs to the instance `GITEA_BASE_URL` points at, the application under test, and not to the instance that holds this repository. Every test calls the API before it touches the browser, so without the token the whole suite fails in `beforeEach` with a 401.

The `.env` file is ignored by Git and must not be committed.

## Running tests

```bash
npm test                      # the three browsers, in parallel
npm run test:chrome           # one browser only
npm run test:serial           # the same suite, one file at a time
HEADLESS=true npm test        # without three windows opening
MAX_WORKERS=1 npm test        # on a machine that cannot hold three browsers
```

Each browser is a Vitest project, so a single run drives Chrome, Firefox and Edge at the same time. `npm run test:serial` runs the same suite one file at a time and must stay green: a suite that only passes in parallel, or only in serial, has a test depending on another.

By default, browsers run **visibly** (not headless), so you can watch the tests execute.

One Vitest worker holds one WebDriver session, because the driver is a singleton per process and Vitest gives each test file its own process. `MAX_WORKERS` is therefore browser capacity rather than CPU tuning: it must never exceed what the machine, or the grid on the other end, can serve. It defaults to 3.

## Continuous testing

`.gitea/workflows/ct.yml` is a second pipeline, separate from CI. It deploys a disposable
Gitea instance and a Selenium container as service containers, registers the first account,
mints an API token for it, and runs the suite against them.

Trigger it from the repository's Actions tab, on the CT workflow, with **Run workflow**.

It never runs on a push or a pull request, so it cannot block a merge. CI stays quality
only: install, format check, lint, typecheck.

It also runs on a schedule, 06:00 on weekdays (server time, America/Bogota). A scheduled run
deploys the application, runs the three browsers in parallel in one job, and leaves a single
report artifact covering all three. It never gates a merge.

### Reports

Every run writes raw results to `allure-results/`. The pipeline turns them into an Allure
report and attaches it to the run as `allure-report`, kept for 14 days. A failed run still
produces one. Each test appears once per browser, told apart by a `browser` parameter.

The report is a single self-contained `index.html`: unpack the artifact and open it, no
server needed.

Locally:

```bash
npm test          # writes allure-results/
npm run report    # generates allure-report/
npm run report:open
```

`npm test` clears `allure-results/` before it runs. Without that the directory accumulates
every run ever made, and results written before a change was made show up beside the current
ones as extra entries in the report.

Runs are independent, so the report shows no trend across runs. Allure history needs a file
carried between runs, and this runner has nowhere to keep one.

## Project structure

```
core/                          # framework, application-agnostic
├── base-pages/base.page.ts    # shared find, click and type helpers
├── config/config.ts           # the application under test URL
├── config/allure.config.ts    # per-test reporting metadata
└── drivers/driver.factory.ts  # builds and shares one WebDriver per worker
src/                           # the suite, specific to Gitea
├── api/clients/               # REST clients built on got
├── context.ts                 # the pages and clients a test is handed
├── pages/                     # page objects: actions and locators
└── tests/                     # specs: assertions only
```

## Troubleshooting

**`401` in `beforeEach`, before any browser opens**
`GITEA_TOKEN` is missing or expired in `.env`. See _Login credentials_ above.

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
