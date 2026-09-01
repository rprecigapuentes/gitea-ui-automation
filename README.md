# Gitea UI Automation

UI automation project using **Selenium WebDriver + TypeScript + Vitest**, supporting Chrome and Firefox.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- Google Chrome installed
- Mozilla Firefox installed
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
```

The `.env` file is ignored by Git and must not be committed.

## Running tests

```bash
npm run test:chrome
npm run test:firefox
```

By default, browsers run **visibly** (not headless), so you can watch the test execute.

To run headless instead:

```bash
cross-env BROWSER=chrome HEADLESS=true vitest run
cross-env BROWSER=firefox HEADLESS=true vitest run
```

## Project structure

```
src/
├── drivers/
│   └── driverFactory.ts   # Creates and configures the WebDriver per browser
└── tests/
    └── example.test.ts    # Example test (Google title check)
```

## Troubleshooting

**`SessionNotCreatedError: This version of ChromeDriver only supports Chrome version X`**
Selenium Manager has a stale cached driver. Clear its cache and re-run:

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.cache\selenium"
```

**`WebDriverError: Process unexpectedly closed with status 0` (Firefox)**
Firefox isn't reachable — usually means it's not in the PATH. Follow the setup steps above and confirm with `where firefox`.

**`Hook timed out in 30000ms`**
The first run can take longer while Selenium Manager downloads the matching driver. This is already handled via `hookTimeout: 60000` in `vitest.config.ts` — if it still times out, check your internet connection or re-run (the driver gets cached after the first successful download).