## 1. New workspace

- [x] 1.1 Create `business-logic/common/package.json` (`@gitea-automation/business-logic-common`, `exports: {"./ui/*": "./ui/*.ts"}`, deps on `business-logic-selenium`/`core-config`/`core-logger`/`core-selenium`/`selenium-webdriver`) and `tsconfig.json` extending `tsconfig.base.json`; verified by `npm run typecheck -w @gitea-automation/business-logic-common` succeeding
- [x] 1.2 Move `business-logic/selenium/ui/pages/**` to `business-logic/common/ui/pages/**` unchanged; verified by the file tree matching 1:1 minus the package prefix

## 2. Fix the imports the move broke

- [x] 2.1 Repoint the 5 files whose relative imports crossed into `business-logic/selenium/api/entities/**` (`label-list.page.ts`, `milestone-list.page.ts`, `organization-dashboard.page.ts`, `new-team.fragment.ts`, `organization.facade.ts`) at `@gitea-automation/business-logic-selenium/api/entities/...`; verified by `tsc --noEmit` resolving every one
- [x] 2.2 Repoint `page.factory.ts` (cucumber), `fixture.ts` and `organizations.test.ts` (vitest) from `business-logic-selenium/ui/pages/...` to `business-logic-common/ui/pages/...`; verified by no remaining `.ts` file matching the old specifier (`grep -rl` came back empty)
- [x] 2.3 Add `@gitea-automation/business-logic-common` to both services' `package.json` dependencies and to `vitest.config.ts`'s `server.deps.inline`; verified by `npm install` linking the workspace and `tsx`/Vitest resolving the new import at runtime

## 3. Clean up the old location

- [x] 3.1 Drop the dead `"./ui/*"` export from `business-logic/selenium/package.json` and remove the emptied `ui/` directory; verified by the directory no longer existing on disk

## 4. Verification

- [x] 4.1 Run `npm run format`, `npm run lint` and `npm run typecheck` from the repo root; all green across every workspace including the new `business-logic-common`
