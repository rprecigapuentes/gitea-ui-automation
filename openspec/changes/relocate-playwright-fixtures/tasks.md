## 1. Move the fixtures into a shared package of the test layer

- [x] 1.1 Add `services/_shared/playwright` with `package.json` (`@gitea-automation/shared-playwright`, `exports` of `"./*": "./*.ts"`, the six dependencies `core/playwright` declares today), `tsconfig.json` extending `../../../tsconfig.base.json`, and a `README.md` saying why the package exists and why it is not a suite; add `services/_shared/*` to the root `workspaces` array and confirm `npm install` resolves every workspace
- [x] 1.2 `git mv` the six modules of `core/playwright/fixtures/` into it; their relative imports are unchanged
- [x] 1.3 Rewrite the 22 import sites in `playwright-bdd` and `playwright-native` from `@gitea-automation/core-playwright/fixtures/X` to `@gitea-automation/shared-playwright/X`, and the stale reference in `playwright-bdd/fixtures/fixture.ts`'s own comment
- [x] 1.4 Update the three manifests: `playwright-bdd` drops `core-playwright` and gains `shared-playwright`, `playwright-native` gains `shared-playwright` and keeps `core-playwright` for `VisualTester` and `PerformanceCollector`, `core/playwright` is left with `@playwright/test` alone
- [x] 1.5 Verify `npm run format:check`, `npm run lint` and `npm run typecheck` pass, and that `grep -rn "business-logic" core --include=*.ts` and `grep -rn "core-playwright/fixtures"` both return nothing

## 2. Point the documentation at the new home

- [x] 2.1 Strip the `Fixtures` section and the `fixtures/` branch from `core/playwright/README.md`, replacing the paragraph that justified the `business-logic` dependency with why the fixtures left
- [x] 2.2 Add the package to the root `README.md` tree, marked as not a suite, and correct the workspace count in the install line
- [x] 2.3 Repoint `services/playwright-bdd/README.md` at the new package
- [x] 2.4 Verify `npm run format:check` passes and no README links at a path that no longer exists
