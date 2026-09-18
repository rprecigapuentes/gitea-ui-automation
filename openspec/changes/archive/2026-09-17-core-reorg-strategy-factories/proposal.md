## Why

Several structural leftovers accumulated across `core/` and `business-logic/` as the Strategy pattern work landed: an empty `core/playwright` package nobody ever filled in, a `ui/` wrapper folder in `core/selenium` around content that's the only thing there, a `config/` folder whose one file is entirely BrowserStack-specific, and two `business-logic/*` packages (`api`, `common`) that used to be split by technology and no longer need to be — both are 100% tech-agnostic today. Separately, `core/page-objects` and `core/api-client` each expose two strategy-construction functions directly; nothing centralizes the choice between them.

## What Changes

- Delete `core/playwright` — no file inside it beyond `package.json`/`README.md`.
- `core/selenium`: `ui/drivers/`, `ui/utils/` move up to `drivers/`, `utils/` directly under `core/selenium/`; `config/` renames to `browserstack-config/`.
- `business-logic/api` and `business-logic/common` merge into a single `business-logic/` package (`@gitea-automation/business-logic`), with exactly four top-level folders: `clients/`, `pages/`, `entities/`, `state/`. `api/`, `common/`, and the `ui/` wrapper inside `common` are gone; `PageFactory` moves into `pages/` since it assembles pages.
- `core/page-objects` and `core/api-client`: each concrete strategy implementation (`selenium-interaction.strategy.ts`, `playwright-interaction.strategy.ts`, `got-request-strategy.ts`, `playwright-request-strategy.ts`) moves into a `strategies/` subfolder. Each package gains a Factory (`InteractionStrategyFactory`, `RequestStrategyFactory`) with one static method per technology; the standalone `createSeleniumStrategy`/`createPlaywrightStrategy`/`createGotStrategy` functions are removed since the Factory is now the single construction point.
- Every consumer (`gitea-selenium-vitest`, `gitea-selenium-cucumber`, `playwright-native`) updates to import through the new paths and the two Factories instead of the old free functions.

### Out of scope

- Any behavioral change to a strategy, client, page, or entity. Pure reorganization plus the Factory indirection — no logic changes.
- `core/config`, `core/data-handler`, `core/logger` — untouched, already flat, single-purpose packages.
- `services/playwright-bdd` — has no code yet, nothing to update.

## Capabilities

No requirement text changes — pure reorganization and a construction-time indirection, no behavior changes. `skip_specs: true`.

## Impact

Removed: `core/playwright/`, `business-logic/api/`, `business-logic/common/`. New: `business-logic/` (package.json at its root), `core/page-objects/strategies/`, `core/page-objects/interaction-strategy.factory.ts`, `core/api-client/strategies/`, `core/api-client/request-strategy.factory.ts`. Modified: `core/selenium/**`, every file under the old `business-logic/api`/`business-logic/common` (relocated, imports updated), `services/gitea-selenium-vitest/src/fixtures/fixture.ts`, `services/gitea-selenium-cucumber/features/support/{hooks,seeded-users,world}.ts` and its step-definitions, `services/playwright-native/fixtures/fixture.ts`, root `package.json` workspaces glob, and every affected README.
