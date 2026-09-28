# @gitea-automation/shared-playwright

The Playwright setup both Playwright suites start from: the fixtures that build a test's strategy, page objects, API clients and session, and the credential and session helpers they need.

## Why it is a package, and why it sits here

A fixture is composition root and setup: it decides which concrete strategy is injected and puts the state a test needs in place. That is test-layer work, which is why the Selenium side keeps its equivalent in `services/gitea-selenium-cucumber/features/support/hooks.ts` rather than in a shared package.

This one is shared because two suites need the same wiring: `playwright-native` and `playwright-bdd`. It lived in `core/playwright` until it was moved here, and that was a layering mistake rather than a placement preference — a fixture composes page objects and API clients, so the package had to import `business-logic`, and a `core/` package that imports `business-logic` points its dependency at the layer above it.

It is not a suite. It declares no `test` script, which is how `ct-functional.yml` already tells what to run from what to depend on. The rule the repository enforces is that **no suite imports another suite**; importing this package is not that.

```
services/
├── _shared/playwright/   ← this package: shared setup, no tests of its own
├── playwright-bdd/
├── playwright-native/
├── gitea-selenium-cucumber/
└── gitea-selenium-vitest/
```

## Structure

```
services/_shared/playwright/
├── credentials.ts               # per-browser owner, invited, token and admin accounts
├── session.util.ts              # sign in through the API, apply the cookies to the context
├── base.fixtures.ts             # strategy, clients, pageObjects, scenarioState, sessionManager, cleanup
├── issues.fixtures.ts           # owner, repository, issue, maintainer, label, milestone
├── organizations.fixtures.ts    # existing organization, seeded users, org with team and repository
└── project-board.fixtures.ts    # organization with repositories, milestone, Kanban project
```

## Fixture implementations, not an extended `test`

The two services extend different bases, so this package exports the implementations and each service calls `.extend()` itself.

```ts
// playwright-native
export const test = base.extend<CoreFixtures>(coreFixtures);

// playwright-bdd, over playwright-bdd's own base
export const test = base.extend<CoreFixtures & BddFixtures>({ ...coreFixtures, ownerCredentials });
```

Two details that fail silently if they are changed. `resolveOwnerCredentials` takes the **project name** and reads the browser from the segment after its last `-`, so projects stay named `<area>-<browser>` (`seeds-chrome`, `visual-firefox`) or plainly after the browser. And `testDataName` reads `process.env.BROWSER`, so a `test:<browser>` script that drops its `cross-env BROWSER=<b>` names every seeded resource `-local-` instead.

## Imports

```ts
import { coreFixtures } from "@gitea-automation/shared-playwright/base.fixtures";
import { resolveOwnerCredentials } from "@gitea-automation/shared-playwright/credentials";
```

The package's `exports` map is `"./*": "./*.ts"`, so every module is reachable by its file name without an entry of its own.
