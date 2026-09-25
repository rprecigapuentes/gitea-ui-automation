## Context

`playwright-bdd` converts `.feature` files into Playwright spec files (`bddgen`), which the normal Playwright runner then executes. So projects, workers, retries, reporters and fixtures are Playwright's own, and `playwright-native` already shows how this repository configures them.

## Decisions

- **One generated directory per project.** `defineBddProject` gives each browser project its own generated tests, so `--project=firefox` only generates and runs firefox. The project names stay `chrome`, `firefox` and `edge`, so the credential lookup `playwright-native` does by project name works unchanged.
- **`bddgen` runs before `playwright test` in every script**, so an edited feature is never run stale.
- **Fixtures mirror `playwright-native`, trimmed to login.** `strategy` and `pageObjects` from `InteractionStrategyFactory.playwright(page)` and `PageFactory`, and `createBdd(test)` on that test to obtain `Given/When/Then`. Clients, session and cleanup fixtures are not needed by login and are left out until a scenario needs them.
- **The credentials module is copied**, not imported from `playwright-native`, because the workspaces do not depend on each other. The duplication is what the later refactor will look at.
- **Steps take the test fixtures through the first argument**, and read the project name from `testInfo` for credentials.
- **`fullyParallel: true`, `workers` left to Playwright**, `1` on CI, as in `playwright-native`.

## Risks

- A generated directory must be gitignored, or it produces noisy diffs.
- `playwright-bdd` needs `@playwright/test`; it is already hoisted from `playwright-native` at 1.63, and the new workspace declares it as its own dev dependency at the same range.
