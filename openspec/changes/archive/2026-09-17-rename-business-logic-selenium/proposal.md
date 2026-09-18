## Why

`business-logic/selenium` (`@gitea-automation/business-logic-selenium`) has zero dependency on Selenium: its `package.json` depends on `got`/`tough-cookie`/`core-api-client`/`core-logger` only, and none of its 8 API clients or 7 entity files import `selenium-webdriver`. All 7 non-`auth` clients already work against either `GotRequestStrategy` or `PlaywrightRequestStrategy` (proven by `playwright-native`'s `clients` fixture), and `AuthClient` is plain `got` + a cookie jar — usable from any browser technology. The name is a leftover from before the api-client Strategy pattern refactor, and it reads as "Selenium-only," which is exactly backwards: raised when asking whether `AuthClient` needed a Playwright-specific twin, when the real issue was the package's name promising something none of its content requires.

## What Changes

- `business-logic/selenium/` renames to `business-logic/api/`, package name `@gitea-automation/business-logic-selenium` → `@gitea-automation/business-logic-api`. No file inside it changes beyond the package name.
- Every importer updates its specifier: `services/gitea-selenium-vitest`, `services/gitea-selenium-cucumber`, `services/playwright-native`, `business-logic/common`.
- Every consuming `package.json`'s dependency entry renames to match.

### Out of scope

- Any logic change to a client, entity, or `ScenarioState`. Pure rename.
- Renaming `gitea-selenium-vitest`/`gitea-selenium-cucumber` themselves — those genuinely are Selenium-specific (real `WebDriver` usage throughout), unlike this package.
- A shared session-management abstraction (`sessionManager`/`applySession` unifying Selenium and Playwright) — a separate, previously-discussed idea, not part of this rename.

## Capabilities

No requirement text changes — pure rename, no behavior changes. `skip_specs: true`.

## Impact

Renamed: `business-logic/selenium/` → `business-logic/api/`. Modified: every file importing `@gitea-automation/business-logic-selenium/*` (~20 files across `business-logic/common`, `services/gitea-selenium-vitest`, `services/gitea-selenium-cucumber`, `services/playwright-native`), plus each of those workspaces' `package.json`.
