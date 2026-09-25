## Why

`services/playwright-bdd` is a reserved, empty workspace. The repository compares runners on the same scenarios: Selenium with Vitest, Selenium with Cucumber and Playwright's own runner. Gherkin on top of the Playwright runner is the missing combination, and it cannot be compared until the tool is installed and runs a scenario on its own.

## What Changes

- Install `playwright-bdd` in `services/playwright-bdd` with its own Playwright config, mirroring the key parts of `playwright-native`: the chrome, firefox and edge projects, the reporters, the credentials resolution per browser and the page-object fixtures over `InteractionStrategyFactory.playwright`.
- Copy `login.feature` from `services/gitea-selenium-cucumber` verbatim, and write its three steps the way `playwright-native` drives the browser: through `pageObjects.loginPage` and `pageObjects.mainPage`, with credentials resolved from the Playwright project name.
- Add scripts to generate the tests from the feature and run them per browser, and in parallel across the three browsers.
- Land it in separate commits: the OpenSpec change, the install and config, the fixtures, then the feature and its steps.

## Capabilities

### New Capabilities

- `playwright-bdd`: the service generates Playwright tests from its own Gherkin features, runs them in parallel on the three browsers and drives the application only through the shared page objects.

## Impact

New: `services/playwright-bdd/{playwright.config.ts,tsconfig.json,.env.example,features/**,fixtures/**}`. Modified: `services/playwright-bdd/package.json`, `package-lock.json`, `.prettierignore` and `eslint.config.js`, which skip the generated tests.

## Out of Scope

- Any scenario other than login, including seeded users and organizations hooks.
- Extracting what `playwright-native` and this service share: that refactor comes later.
- The CI workflows, Allure reporting and the non-functional suites.
- Changes to page objects, the strategies or `playwright-native`.
