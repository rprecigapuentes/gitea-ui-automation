## 1. Remove the workflow

- [x] 1.1 Delete `.gitea/workflows/bs.yml`, and verify no other workflow references it, needs it, or reads the `allure-report-browserstack` artifact.

## 2. Remove what documents it

- [x] 2.1 Remove the `bs.yml` bullet from the root `README.md`'s CI/CD list, and verify the `npm run test:browserstack` row in the scripts table stays, because running against BrowserStack by hand is still possible.
- [x] 2.2 Remove the paragraph describing `bs.yml` from `services/gitea-selenium-vitest/README.md`, and verify the surrounding sections on the BrowserStack driver and its credentials are left alone.
- [x] 2.3 Verify no README mentions `bs.yml`. A proposal that named it while it existed keeps the mention: those documents record what was true when they were written and are not rewritten.

## 3. Confirm nothing else broke

- [x] 3.1 Run the three gates, `npm run format`, `npm run lint` and `npm run typecheck`, and verify all three pass.
