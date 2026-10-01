# gitea-selenium-cucumber

> Gherkin scenarios run by Cucumber, driving Gitea through Selenium WebDriver on Chrome, Firefox and
> Edge.

![Cucumber 11](https://img.shields.io/badge/Cucumber-11-23D96C?logo=cucumber&logoColor=white)
![Selenium 4](https://img.shields.io/badge/Selenium-4.48-43B02A?logo=selenium&logoColor=white)

## Contents

- [Quick start](#quick-start)
- [The features](#the-features)
- [Tags](#tags)
- [How a step reaches the browser](#how-a-step-reaches-the-browser)
- [Configuration](#configuration)
- [Structure](#structure)

## Quick start

```bash
npm install                                   # from the repository root
cp services/gitea-selenium-cucumber/.env.example services/gitea-selenium-cucumber/.env
npm run test:cucumber                         # the three browsers, as three processes
```

| Command (from this folder)                   | Runs                                                       |
| -------------------------------------------- | ---------------------------------------------------------- |
| `npm test`                                   | the three browsers in parallel, what CI runs               |
| `npm run test:chrome` / `:firefox` / `:edge` | one browser                                                |
| `CUCUMBER_TAGS="@smoke" npm test`            | only the scenarios carrying a tag                          |
| `npm run test:tag:parallel`                  | the run, with the Allure report built and opened alongside |
| `npm run report` / `report:open`             | build / open the Allure report                             |

## The features

| Feature                 | Scenarios                                                         | Tags                          |
| ----------------------- | ----------------------------------------------------------------- | ----------------------------- |
| `login.feature`         | a valid user signs in                                             |                               |
| `organizations.feature` | one `@e2e` flow of teams and permissions, five `@smoke` scenarios | `@organizations` `@cleanup`   |
| `project-board.feature` | the Kanban board: template, cards, columns, drag and drop         | `@project-board` `@cleanup`   |
| `demo-e2e.feature`      | a work item from team assignment to the board that tracks it      | `@demo-e2e` `@cleanup` `@e2e` |

`login`, `organizations`, `project-board` and `demo-e2e` exist with **identical text** in
[`playwright-bdd`](../playwright-bdd/README.md). Change one and the other suite breaks.

## Tags

A tag either selects scenarios or attaches setup to them. The setup lives in
`features/support/hooks.ts`, so a scenario stays the steps of the behaviour under test.

| Tag                | Effect                                                                      |
| ------------------ | --------------------------------------------------------------------------- |
| `@smoke`, `@e2e`   | scope: select with `CUCUMBER_TAGS`                                          |
| `@cleanup`         | after the scenario, pass or fail, delete its organization and repositories  |
| `@project-board`   | before it, seed an organization with two repositories and one issue in each |
| `@demo-e2e`        | the same, plus a milestone on the first repository                          |
| `@team-repository` | before it, seed an organization with a team and a repository                |

Seeding goes through the API, so a scenario that tests "add a repository to a team" does not spend
its time creating the organization through the screen.

## How a step reaches the browser

```
step definition  →  this.pages.<page>  →  page object  →  Selenium strategy  →  WebDriver
```

- **`GiteaWorld`** (`support/world.ts`) is Cucumber's per-scenario object. The `Before` hook fills
  it with the driver, an empty `scenarioState`, a `PageFactory` and an API client.
- **Steps never build a page object or touch a selector.** They read pages off `this.pages`, the
  shared page objects from [`business-logic`](../../business-logic/README.md).
- **Values travel through `this.scenarioState`**, the same `ScenarioState` the other suites use.
- **Assertions** use `expect` from Vitest, as an assertion library only.

```ts
When("I log in with valid credentials", async function (this: GiteaWorld) {
  const { username, password } = resolveOwnerCredentials();
  await this.pages.loginPage.login(username, password);
});
```

## Hooks

| Hook                 | Does                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| `BeforeAll`          | deletes the account's leftover organizations, creates two seeded users |
| `Before`             | opens the browser and builds the world                                 |
| `Before` (tagged)    | seeds the state a tag asks for                                         |
| `After` (`@cleanup`) | deletes the scenario's repositories, then its organization             |
| `After`              | closes the browser                                                     |
| `AfterAll`           | deletes the seeded users                                               |

Steps get 20 seconds instead of Cucumber's default 5, so a Selenium wait reports its own clearer
error before Cucumber's generic timeout fires.

## Configuration

`.env` in this folder, from `.env.example`:

| Variable                              | For                                                          |
| ------------------------------------- | ------------------------------------------------------------ |
| `GITEA_BASE_URL`                      | the Gitea under test                                         |
| `GITEA_OWNER_<BROWSER>`, `…_PASSWORD` | one owner account per browser                                |
| `GITEA_TOKEN_<BROWSER>`               | that owner's API token, for seeding                          |
| `GITEA_ADMIN_TOKEN`                   | an administrator's token with `write:admin`, to create users |

`<BROWSER>` is `CHROME`, `FIREFOX` or `EDGE`. Each browser has its own account, so the three
processes never act as the same user.

## Structure

```
services/gitea-selenium-cucumber/
├── cucumber.mjs                 runner config: steps, features, reporters, tags
└── features/
    ├── scenarios/               *.feature
    ├── step-definitions/        one *.steps.ts per feature
    └── support/
        ├── world.ts             GiteaWorld
        ├── hooks.ts             lifecycle, seeding, cleanup
        ├── scenario-state.ts    typed reads of scenarioState
        ├── seeded-users.ts      the two users BeforeAll creates
        └── credentials.ts       per-browser accounts
```

Results go to `allure-results/` and `reports/junit-<browser>.xml`.
