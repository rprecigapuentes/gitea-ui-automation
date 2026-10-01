# @gitea-automation/business-logic

> Everything the suites know about Gitea: its pages, its API, and what a scenario remembers between
> steps. Written once, shared by all four suites.

No suite keeps its own page object or API client. A selector Gitea changes is fixed here, in one
file, for every suite at once.

## Contents

- [Structure](#structure)
- [Page objects](#page-objects)
- [API clients](#api-clients)
- [Entities and scenario state](#entities-and-scenario-state)
- [PageFactory](#pagefactory)

## Structure

```
business-logic/
├── pages/                     page objects, one folder per area of Gitea
│   ├── authentication/          login
│   ├── common/                  dashboard, navigation bar
│   ├── issues/                  issue, issue form, issue list, labels, milestones
│   ├── organizations/           create, dashboard, teams; the organization facade
│   ├── projects/                project form, project list, Kanban board
│   ├── repositories/            create, code tab, files
│   └── page.factory.ts          PageFactory
├── clients/                   one API client per Gitea resource
├── entities/                  the shapes those clients send and receive
└── state/scenario.entity.ts   ScenarioState
```

## Page objects

Every page object extends `BasePage` or `BaseComponent` from
[`core-page-objects`](../core/page-objects/README.md), so it runs on Selenium or on Playwright
depending on the strategy it is built with.

| Kind         | File            | Is                                                                       | Example              |
| ------------ | --------------- | ------------------------------------------------------------------------ | -------------------- |
| **Page**     | `*.page.ts`     | a view with its own URL, opened with `open()` / `openFor(...)`           | `IssuePage`          |
| **Fragment** | `*.fragment.ts` | a piece several pages share, with no URL of its own                      | `NavBarFragment`     |
| **Facade**   | `*.facade.ts`   | one flow across several fragments, handing back the one that now applies | `OrganizationFacade` |

Three conventions hold in every file:

- **Locators live in one `locators` object** at the top of the class, as CSS strings, grouped into
  sections by the part of the page they belong to. Nothing outside the page object ever sees one,
  and a lint rule rejects a spec or step that calls the browser directly.
- **Methods say what the user does or sees**, never how: `createScopedLabel`, `hasMember`,
  `moveCard`. A method that changes the screen waits for the proof that it finished.
- **Checks return booleans and log why they are false.** `hasExpectedElementsDisplayed()` returns
  `false` rather than throwing, and records the URL and the reason first, so a red run says what the
  screen showed.

## API clients

Tests build their data through the API and keep the screen for what they are testing.

| Client               | Covers                                                                |
| -------------------- | --------------------------------------------------------------------- |
| `AuthClient`         | signing in over HTTP and returning the session cookies                |
| `UserClient`         | the signed-in user; creating and deleting users through the admin API |
| `OrganizationClient` | organizations and their members                                       |
| `TeamClient`         | teams                                                                 |
| `RepositoryClient`   | repositories                                                          |
| `IssueClient`        | issues                                                                |
| `LabelClient`        | labels                                                                |
| `MilestoneClient`    | milestones                                                            |

All but `AuthClient` extend `GiteaApiClient` from [`core-api-client`](../core/api-client/README.md):

```ts
const issues = new IssueClient(RequestStrategyFactory.got(baseUrl, token));
const issue = await issues.createIssue(owner, repository, "A title");
```

`AuthClient` posts the login form itself, because Gitea's session is a browser cookie rather than a
token. The suites use it to start a test already signed in.

## Entities and scenario state

Each entity comes in up to four shapes, named the same way everywhere:

| Name          | Is                                                |
| ------------- | ------------------------------------------------- |
| `Label`       | what the API returns                              |
| `NewLabel`    | what the API is sent to create one                |
| `LabelRow`    | what the list page shows for one                  |
| `SeededLabel` | the id and name a scenario keeps to find it again |

`ScenarioState` is what one scenario remembers between steps: the organization it created, its
teams, the issue it filed. It never travels to Gitea, and it starts empty for every scenario, which
is what keeps parallel scenarios from reading each other's data. Cleanup reads it to know what to
delete.

## PageFactory

`PageFactory` is the single entry point a suite uses: one getter per page and fragment, each built
on first use and reused for the rest of the scenario.

```ts
const pages = new PageFactory(strategy, scenarioState);

await pages.loginPage.login(username, password);
await pages.orgFacade.navigateToTeamsTab();
```

Being lazy and memoized matters for fragments that hold state, such as which organization tab is
open: a fresh instance on every call would forget it between steps.
