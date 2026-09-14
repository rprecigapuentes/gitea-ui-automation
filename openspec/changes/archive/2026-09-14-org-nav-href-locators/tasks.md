## 1. Switch org nav tabs to href-based locators

- [x] 1.1 Add `BaseComponent.getCurrentUrl()`. Derive the org name from the URL in `OrgNavigationFragment` and build each tab locator from its href, scoped to `overflow-menu[role='navigation']`. Verified: root `typecheck`/`eslint` clean, repeated real runs of `--tags "@e2e"` (nav-related steps clean across 4 runs; the org-navigation step that used to fail now passes every time) and `--tags "@smoke"` (clean), plus Vitest's `organizations.test.ts` on chrome.
