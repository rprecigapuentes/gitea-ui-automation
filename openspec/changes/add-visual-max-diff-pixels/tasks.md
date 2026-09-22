## 1. Add the pixel tolerance option

- [x] 1.1 Add `maxDiffPixels?: number` to `VisualOptions` in `core/playwright/visual-tester/visual-tester.ts` and forward it to `toHaveScreenshot`'s own `maxDiffPixels` option in both `verifyPage` and `verifyComponent`; verify `npm run typecheck -w @gitea-automation/core-playwright` passes and a call site that omits it still type-checks.
- [x] 1.2 Verify the option actually loosens the comparison: pick a spec with a known small baseline diff (e.g. `main-view.spec.ts`), pass a `maxDiffPixels` above its current diff count, and confirm it now passes; confirm the same spec still fails without the option.
