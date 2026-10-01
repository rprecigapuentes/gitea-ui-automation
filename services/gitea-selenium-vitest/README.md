# gitea-selenium-vitest

> Selenium WebDriver tests written in plain TypeScript and run by Vitest, on Chrome, Firefox and
> Edge, locally, on a Selenium grid or on BrowserStack.

![Vitest 4](https://img.shields.io/badge/Vitest-4.1-6E9F18?logo=vitest&logoColor=white)
![Selenium 4](https://img.shields.io/badge/Selenium-4.48-43B02A?logo=selenium&logoColor=white)

## Contents

- [Quick start](#quick-start)
- [The tests](#the-tests)
- [Fixtures](#fixtures)
- [Configuration](#configuration)
- [BrowserStack](#browserstack)
- [Reports and CI](#reports-and-ci)
- [Structure](#structure)
- [Troubleshooting](#troubleshooting)

## Quick start

Needs Node 22 and Chrome, Firefox and Edge installed. Drivers are resolved by
[Selenium Manager](https://www.selenium.dev/documentation/selenium_manager/) on the first run.

```bash
npm install                                     # from the repository root
cp services/gitea-selenium-vitest/.env.example services/gitea-selenium-vitest/.env
npm test                                        # from the root: the three browsers in parallel
```

| Command                                      | Runs                                                      |
| -------------------------------------------- | --------------------------------------------------------- |
| `npm test`                                   | Chrome, Firefox and Edge as three processes; what CI runs |
| `npm run test:chrome` / `:firefox` / `:edge` | one browser                                               |
| `npm run test:serial`                        | the suite one file at a time                              |
| `npm run test:browserstack`                  | the BrowserStack platforms                                |
| `npm run report` / `report:open`             | build / open the Allure report                            |
| `HEADLESS=true npm test`                     | without browser windows                                   |

The suite has to pass both in parallel and in serial: a test that passes only one way depends on
another test.

## The tests

| File                     | Case                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `organizations.test.ts`  | an owner creates an organization and two teams, adds a member, removes them                                   |
| `issue-metadata.test.ts` | AT-ISS-01: an issue keeps its Markdown, label, milestone and assignee, and closing it completes the milestone |
| `issues.test.ts`         | AT-ISS-02: a scoped label replaces the label of its own scope                                                 |
| `login.test.ts`          | skipped: the Cucumber, native and BDD suites each cover the same login                                        |

A test imports `test` from `src/fixtures/fixture.ts` and only asserts. It reaches the browser
through the shared page objects of [`business-logic`](../../business-logic/README.md), never through
the driver: a direct `driver.findElement` in a test fails lint.

```ts
test("AT-ISS-02 …", async ({ repository, issue, labelListPage, issuePage }) => {
  await labelListPage.openNewLabelForm();
  expect(await labelListPage.isExclusiveFieldEnabled()).toBe(false);
});
```

## Fixtures

Vitest builds what a test names in its signature and tears it down afterwards, pass or fail.

| Fixture                                                                                 | Gives                                                |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `driver`                                                                                | one browser per test file, closed when the file ends |
| `strategy`                                                                              | the driver wrapped in the Selenium strategy          |
| `loginPage`, `issuePage`, … `organizationPages`                                         | page objects built over that strategy                |
| `userClient`, `issueClient`, …                                                          | API clients with the browser's owner token           |
| `sessionManager`                                                                        | `loginAsOwner()`, `loginAs()`, `logout()`            |
| `repository`, `issue`, `scopedLabels`, `milestone`, `classificationLabel`, `maintainer` | data seeded through the API                          |
| `scenarioState`                                                                         | what the test created, read by cleanup               |

Four run on every test without being named (`auto`):

| Fixture                | Does                                                                     |
| ---------------------- | ------------------------------------------------------------------------ |
| `loggedInSession`      | signs in through the API before the test, unless it sets `skipAutoLogin` |
| `screenshotOnFailure`  | attaches a screenshot to the Allure report when the test fails           |
| `cleanupOrganizations` | deletes the organization the test recorded                               |
| `browserstackStatus`   | marks the BrowserStack session passed or failed                          |

## Configuration

`.env` in this folder, from `.env.example`. `<BROWSER>` is `CHROME`, `FIREFOX` or `EDGE`:

| Variable                              | For                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `GITEA_BASE_URL`                      | the Gitea under test, never the one hosting this repository                         |
| `GITEA_OWNER_<BROWSER>`, `…_PASSWORD` | one owner account per browser                                                       |
| `GITEA_INV_<BROWSER>`, `…_PASSWORD`   | one invited account per browser                                                     |
| `GITEA_TOKEN_<BROWSER>`               | the owner's token: read and write on user, repository, issue and organization       |
| `MAX_WORKERS`                         | sessions per process, `1` by default; never more than the machine or grid can serve |

Each browser has its own accounts, so three browsers in parallel never act as the same user.

## BrowserStack

The same suite runs on [BrowserStack Automate](https://automate.browserstack.com/) without changing a
test: BrowserStack replaces the browser and nothing else.

```dotenv
GITEA_BASE_URL=http://bs-local.com:3000      # localhost is the remote machine inside BrowserStack
BROWSERSTACK_USERNAME=…
BROWSERSTACK_ACCESS_KEY=…
```

`npm run test:browserstack` starts the BrowserStack Local tunnel, runs every `bs-*` project in
`vitest.config.ts`, marks each session passed or failed, and stops the tunnel.

## Reports and CI

Every run writes `allure-results/` (cleared before `npm test`) and one `reports/junit-<browser>.xml`
per browser. `npm run report` builds a single self-contained `allure-report/index.html`.

CI runs this suite in `ct-functional.yml`, daily and on demand, against a disposable Gitea and a
Selenium grid service, and publishes `allure-report-gitea-selenium-vitest`. It never gates a merge.

## Structure

```
services/gitea-selenium-vitest/
├── vitest.config.ts                 one project per browser, plus the bs-* platforms
├── config/
│   ├── allure.config.ts             tags each result with its browser
│   └── browserstack.global-setup.ts starts and stops the BrowserStack tunnel
├── src/
│   ├── fixtures/fixture.ts          the fixtures above
│   ├── utils/                       session (API login into the browser), per-browser credentials
│   └── entities/                    fixture types
└── tests/                           the specs
```

## Troubleshooting

<details>
<summary><b>401 before any browser opens</b></summary>

`GITEA_TOKEN_<BROWSER>` is missing or expired. Every test calls the API before it touches the
browser.
</details>

<details>
<summary><b>Firefox: <code>Process unexpectedly closed with status 0</code> (Windows)</b></summary>

Firefox is not in the PATH. Add its folder (usually `C:\Program Files\Mozilla Firefox`) to the
system `Path`, reopen the terminal and check with `where firefox`.

```powershell
[Environment]::SetEnvironmentVariable("Path",
  [Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\Program Files\Mozilla Firefox",
  "Machine")
```

</details>

<details>
<summary><b><code>This version of ChromeDriver only supports Chrome version X</code></b></summary>

Selenium Manager cached a stale driver. Delete `~/.cache/selenium` and run again.
</details>

<details>
<summary><b>The machine cannot hold three browsers</b></summary>

Run one at a time with `npm run test:chrome`, or set `HEADLESS=true`.
</details>
