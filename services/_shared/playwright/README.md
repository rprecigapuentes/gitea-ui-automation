# @gitea-automation/shared-playwright

> The fixtures both Playwright suites start from: strategy, page objects, API clients, session,
> seeded data and cleanup.

This is not a suite. It declares no `test` script, and it holds no test of its own: it is the
setup that `playwright-native` and `playwright-bdd` would otherwise each have to write.

## How a fixture works here

A test **declares** what it needs and Playwright builds it before the test, then tears it down
afterwards, whether the test passed or failed:

```ts
test("a scoped label replaces its own scope", async ({ repository, issue, pageObjects }) => {
  // the repository and the issue already exist; both are removed when the test ends
});
```

That is what replaces `beforeEach`, `afterEach` and `try` / `finally` in the test body. A fixture
marked `auto` runs for every test without being named, which is how cleanup can never be forgotten.

## Fixtures

| File                        | Fixtures                                                                         |
| --------------------------- | -------------------------------------------------------------------------------- |
| `base.fixtures.ts`          | `strategy`, `clients`, `pageObjects`, `scenarioState`, `sessionManager`          |
|                             | `cleanupCreatedOrganization`, `cleanupOrganizationsBeforeRun` (both `auto`)      |
| `issues.fixtures.ts`        | `owner`, `repository`, `issue`, `maintainer`, `classificationLabel`, `milestone` |
| `organizations.fixtures.ts` | `existingOrganization`, `seededUsers`, `seededOrganizationWithTeamAndRepository` |
| `project-board.fixtures.ts` | `seededOrganizationWithRepositories`, `seededMilestone`, `kanbanProject`         |

| Helper            | Does                                                                      |
| ----------------- | ------------------------------------------------------------------------- |
| `credentials.ts`  | picks the owner, invited, token and admin account for the running browser |
| `session.util.ts` | signs in over HTTP and hands the cookies to the browser context           |

## Cleanup

| Fixture                         | When                                 | Removes                                                 |
| ------------------------------- | ------------------------------------ | ------------------------------------------------------- |
| `cleanupCreatedOrganization`    | after every test                     | the organization in `scenarioState`, repositories first |
| `cleanupOrganizationsBeforeRun` | before a test tagged `@organization` | leftovers under the `test-orgs` prefix only             |

Gitea refuses to delete an organization that still owns a repository, so the repositories go first.
The before-run sweep never touches a name outside its prefix, so parallel workers and other suites
are safe.

## Using it

The two suites extend different bases, so this package exports the implementations and each suite
calls `.extend()` itself:

```ts
// playwright-native
export const test = base.extend<CoreFixtures & OrganizationCleanupFixtures>({
  ...coreFixtures,
  ...organizationCleanupFixtures,
});
```

## Two things that fail silently

- **Project names end in the browser.** Credentials are resolved from the part of the project name
  after its last `-` (`chrome`, `visual-firefox`, `seeds-chrome`). A project named otherwise gets no
  account. `chromium` resolves to the Chrome account.
- **Scripts set `BROWSER`.** `testDataName` reads it to name what a test creates. A script that drops
  its `cross-env BROWSER=<browser>` names everything `-local-`, and the three browsers collide.
