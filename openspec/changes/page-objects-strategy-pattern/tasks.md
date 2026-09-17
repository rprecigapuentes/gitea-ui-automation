## 1. Scaffolding, interfaces, both strategies, Context classes

- [x] 1.1 Create `core/page-objects/package.json` (`@gitea-automation/core-page-objects`, `exports: {"./*": "./*.ts"}`, deps on `core-logger`/`core-selenium`/`selenium-webdriver`/`@playwright/test`) and `tsconfig.json`; verify `npm install` links the workspace
- [x] 1.2 Write `element-handle.interface.ts` (`IElementHandle`) and `interaction-strategy.interface.ts` (`IInteractionStrategy`, locators as `string`, including the four new methods `queryAll`/`waitFor`/`waitForUrl`/`executeScript`)
- [x] 1.3 Write `base-component.ts`/`base.page.ts` (the Context classes: constructor-injected `strategy: IInteractionStrategy`, every method a one-line delegate)
- [x] 1.4 Write `selenium-interaction.strategy.ts` (real port of `core/selenium/ui/base-pages/base-component.ts`'s logic — stale-element retry, `lookupTails` dedup, drag handling — wrapping `WebElement`s into `IElementHandle` only after the retry loop) and `playwright-interaction.strategy.ts` (every interface method stubbed with `console.log` + a type-satisfying placeholder return, never throwing); delete the two placeholder files (`selenium-base-component.strategy.ts`, `playwright-base-component.strategy.ts`) they replace
- [x] 1.5 Write `createSeleniumStrategy(driver)`/`createPlaywrightStrategy(page)` factory functions
- [x] 1.6 Verify `npm run typecheck -w @gitea-automation/core-page-objects` passes standalone and nothing else in the repo changes

## 2. Migrate authentication/ + common/

- [x] 2.1 Migrate `login.page.ts`, `main.page.ts`, `common/fragments/nav-bar.fragment.ts`: base-class import → `core-page-objects`, locators → strings, constructor → injected `strategy`, the two direct `this.driver.getCurrentUrl()` calls → `this.getCurrentUrl()`
- [x] 2.2 Wire `createSeleniumStrategy(driver)` into `page.factory.ts` and `fixture.ts` for these 3 classes' construction sites
- [x] 2.3 Verify `npm run typecheck --workspaces --if-present` is green (confirmed); grep confirms zero Selenium references left in the 3 migrated files; a smoke script instantiating all 3 with `createPlaywrightStrategy` and calling their methods (`login()`, `getUrl()`, `waitForElements()`) ran clean, only `[playwright] ...` logs, no throw — running the actual Cucumber/Vitest login scenarios against a real Gitea instance was not done from this environment (no reachable test instance here); do that functional run in your own environment before trusting this stage fully

## 3. Migrate issues/

- [ ] 3.1 Migrate `issue.page.ts`, `issue-list.page.ts`, `create-issue.page.ts`, `label-list.page.ts`, `milestone-list.page.ts`, `fragments/label-chip.fragment.ts`, `fragments/sidebar-combo.fragment.ts` — this is where `queryAll`/`waitFor`/`waitForUrl`/`executeScript` get their first real call sites, and `LabelChipFragment`'s `WebElement` root becomes `IElementHandle`
- [ ] 3.2 Update `page.factory.ts`/`fixture.ts` construction for these 7 classes
- [ ] 3.3 Verify typecheck green; run issues/labels/milestones suites and confirm they pass, with particular attention to the Fomantic-modal `executeScript` rewrite (string → function) and row-attribute reads in `label-list.page.ts`

## 4. Migrate organizations/

- [ ] 4.1 Migrate `create-organization.page.ts` (normalize its 4 `By.id`/inconsistent-`By.css` locators to plain `#id` strings), `organization-dashboard.page.ts`, `facade/organization.facade.ts`, and the 5 `organizations/fragments/*.fragment.ts` files
- [ ] 4.2 Update `page.factory.ts`/`fixture.ts` construction for these 7 classes, including `OrganizationFacade`'s multi-fragment constructor forwarding `strategy` to each injected fragment
- [ ] 4.3 Verify typecheck green; run organization/team suites, including `services/gitea-selenium-vitest/tests/organizations.test.ts`'s direct fragment import

## 5. Migrate projects/

- [ ] 5.1 Migrate `create-project.page.ts`, `project-list.page.ts`, `project-board.page.ts`, `fragments/project-column.fragment.ts` — fix every mid-method `this.driver` → `this.strategy` in `project-board.page.ts`'s 5 `ProjectColumnFragment.byTitle`/`.default` call sites, and change `getCardsLocator(): By` to `(): string`
- [ ] 5.2 Update `page.factory.ts`/`fixture.ts` construction for these 4 classes
- [ ] 5.3 Verify typecheck green; run the project-board suite, especially the drag-and-drop (`moveCard`) scenarios

## 6. Migrate repositories/

- [ ] 6.1 Migrate `create-repository.page.ts` and the 5 `repositories/fragments/*.fragment.ts` files; leave `create-repository.page.ts`'s `getUrl()` throwing `"Method not implemented."` as-is
- [ ] 6.2 Update `page.factory.ts`/`fixture.ts` construction for these 6 classes
- [ ] 6.3 Verify typecheck green; run repository-related suites

## 7. Retire the old Selenium-only base classes

- [ ] 7.1 Delete `core/selenium/ui/base-pages/base-component.ts` and `base.page.ts`
- [ ] 7.2 Verify `npm run typecheck --workspaces --if-present` is green, grep confirms zero remaining imports of `@gitea-automation/core-selenium/ui/base-pages/*` anywhere in the repo, `core-selenium`'s own typecheck still passes, and a full Cucumber + Vitest run (all suites, all browsers) passes as the final regression gate
