## 1. Remove unmatched Playwright specs

- [x] 1.1 Delete `services/playwright-native/tests/gitea-smoke.spec.ts` and verify `git status` shows it removed
- [x] 1.2 Delete `services/playwright-native/tests/login-api.spec.ts` and verify `git status` shows it removed
- [x] 1.3 Run the Playwright suite's typecheck/lint (per `services/playwright-native/package.json` scripts) and verify it passes with no dangling references to the deleted files
