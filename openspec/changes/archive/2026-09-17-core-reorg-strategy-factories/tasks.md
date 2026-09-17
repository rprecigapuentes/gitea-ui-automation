## 1. Delete core/playwright

- [x] 1.1 Confirm it holds nothing but `package.json`/`README.md`, delete the folder
- [x] 1.2 Verify `npm run typecheck --workspaces --if-present` and `npm run lint` green

## 2. Flatten core/selenium

- [x] 2.1 Move `ui/drivers/driver.factory.ts` → `drivers/driver.factory.ts`, `ui/utils/html5-drag.util.ts` → `utils/html5-drag.util.ts`; delete the now-empty `ui/` folder
- [x] 2.2 Rename `config/` → `browserstack-config/` (file inside keeps its name, `browserstack.config.ts`)
- [x] 2.3 Update `core/selenium/package.json`'s `exports` map (`./drivers/*`, `./utils/*`, `./browserstack-config/*`)
- [x] 2.4 Update every importer's specifier (`core-selenium/ui/drivers/...` → `core-selenium/drivers/...`, `core-selenium/ui/utils/...` → `core-selenium/utils/...`, `core-selenium/config/...` → `core-selenium/browserstack-config/...`). Also fixed `driver.factory.ts`'s own relative import to `browserstack.config` (one folder shallower now: `../../config/` → `../browserstack-config/`)
- [x] 2.5 Verify `npm run typecheck --workspaces --if-present` and `npm run lint` green

## 3. Merge business-logic/api and business-logic/common into business-logic/

- [x] 3.1 Move `business-logic/api/api/clients/**` → `business-logic/clients/**`, `business-logic/api/api/entities/**` → `business-logic/entities/**`, `business-logic/api/state/**` → `business-logic/state/**`, `business-logic/common/ui/pages/**` → `business-logic/pages/**`, `business-logic/common/ui/page.factory.ts` → `business-logic/pages/page.factory.ts`
- [x] 3.2 Write a single `business-logic/package.json` (`@gitea-automation/business-logic`, merged dependencies, `exports` for `./clients/*`, `./pages/*`, `./entities/*`, `./state/*`) and `business-logic/tsconfig.json`; delete both old package.json/tsconfig.json pairs and the now-empty `api/`, `common/` folders
- [x] 3.3 Update every import: cross-references that used to cross the `business-logic-api`/`business-logic-common` package boundary become relative imports within `business-logic/`; every external consumer's `@gitea-automation/business-logic-api/*`/`@gitea-automation/business-logic-common/*` becomes `@gitea-automation/business-logic/*`
- [x] 3.4 Change root `package.json`'s `workspaces` entry from `"business-logic/*"` to `"business-logic"`; update every consuming service's `package.json` dependency entries (collapsed two entries into one in each) and `gitea-selenium-vitest/vitest.config.ts`'s `deps.inline` list
- [x] 3.5 `package-lock.json` had significant pre-existing drift (stale `extraneous` entries for `business-logic/selenium`, `business-logic/playwright`, and a bare `core` workspace, left over from earlier renames this session) that collided with the new literal `business-logic` workspace entry and broke `npm install` (`404` trying to fetch `@gitea-automation/core` from the registry). Deleted and regenerated it from scratch — clean, zero `extraneous` entries. Verified `npm run typecheck --workspaces --if-present` and `npm run lint` green (after also fixing `state/scenario.entity.ts`'s relative imports, still pointing at the old `../api/entities/` path)

## 4. core/page-objects: strategies/ subfolder + InteractionStrategyFactory

- [x] 4.1 Move `selenium-interaction.strategy.ts`, `playwright-interaction.strategy.ts` into `strategies/`; remove their `createSeleniumStrategy`/`createPlaywrightStrategy` exports
- [x] 4.2 Write `interaction-strategy.factory.ts` (`InteractionStrategyFactory.selenium(driver)`, `.playwright(page)`)
- [x] 4.3 Update every consumer (`gitea-selenium-vitest/fixtures/fixture.ts`, `gitea-selenium-cucumber/support/hooks.ts`, `playwright-native/fixtures/fixture.ts`) to import and call the Factory instead of the removed functions. Also fixed a stale comment in `base-component.ts` naming the removed functions
- [x] 4.4 Verify `npm run typecheck --workspaces --if-present` and `npm run lint` green

## 5. core/api-client: strategies/ subfolder + RequestStrategyFactory

- [x] 5.1 Move `got-request-strategy.ts`, `playwright-request-strategy.ts` into `strategies/`; remove their `createGotStrategy`/`createPlaywrightStrategy` exports
- [x] 5.2 Write `request-strategy.factory.ts` (`RequestStrategyFactory.got(baseUrl, token)`, `.playwright(baseUrl, token)`)
- [x] 5.3 Update every consumer (`gitea-selenium-vitest/fixtures/fixture.ts`, `gitea-selenium-cucumber/support/{hooks,seeded-users}.ts`, `playwright-native/fixtures/fixture.ts`) to import and call the Factory instead of the removed functions. `organizations.steps.ts` no longer constructed its own client (fixed in an earlier change), so nothing to update there
- [x] 5.4 Verify `npm run typecheck --workspaces --if-present` and `npm run lint` green

## 6. Docs and full verification

- [x] 6.1 Updated every README touched by any of the above: root `README.md`, `core/README.md`, `core/selenium/README.md`, `core/page-objects/README.md`, `core/api-client/README.md`, `business-logic/README.md` (rewritten as the package's own, merging what used to be `business-logic/api/README.md` and `business-logic/common/README.md`), `services/gitea-selenium-vitest/README.md`, `services/gitea-selenium-cucumber/README.md`, `services/playwright-native/README.md`, `services/playwright-bdd/README.md`
- [x] 6.2 Ran `gitea-selenium-vitest` chrome (4/4), `gitea-selenium-cucumber` chrome (6/6), `playwright-native` chrome (3/3) against the local Gitea instance — all clean, zero regressions
- [x] 6.3 Archive this change and commit
