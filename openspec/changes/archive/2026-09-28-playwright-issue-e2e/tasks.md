## 1. Seed fixtures

- [x] 1.1 Add `repository`, `issue`, `maintainer`, `classificationLabel` and `milestone` to `fixtures/issues-fixtures.ts`, deriving the browser from `testInfo.project.name` where Vitest reads `process.env.BROWSER`

## 2. Port AT-ISS-01

- [x] 2.1 Write `tests/issue-metadata.spec.ts` against `pageObjects`, with no assertion dropped
- [x] 2.2 Run it on chrome, firefox and edge, alone and with `test:parallel`

Green on firefox when this was written. Chrome and edge were unrun then, because their branded builds
were not installed on this machine, only bundled Chromium and Firefox. That is no longer the case:
both are installed, and the case was run alone on each - chrome 5.8s, firefox 8.5s, edge 5.7s - and
under `test:parallel`, where it passed inside a full three-browser run of 16 tests each.

## 3. Port AT-ISS-02

- [x] 3.1 Write `tests/scoped-labels.spec.ts` against `pageObjects`, with no assertion dropped
- [x] 3.2 Run it on chrome, firefox and edge, alone and with `test:parallel`

Same as 2.2: green on firefox when written, then run on all three once the branded builds were
installed - chrome 6.6s, firefox 9.6s, edge 7.3s - and green under `test:parallel` in the same full
run.

## 4. Agree on what a URL wait means

Found while reading the two strategies before 2.1: `IssueListPage.filterByLabel` waits on the string `labels=<id>`, which `until.urlContains` matches as a substring and `page.waitForURL` matches as a glob against the whole URL. Reproduced outside Gitea against a `file://` URL carrying a query string: the string times out, a predicate and a regex both match. `filterByMilestone`, one line below, already waits on a regex.

- [x] 4.1 Make `filterByLabel` wait on the regex `labels=<id>(&|$)` instead, the form both strategies read the same way
- [x] 4.2 Confirm the Vitest suite still passes, since the page object is shared

Green on all three browsers, 4 test files and 4 tests each, run as `test:parallel`. The regex reads
the same way through `until.urlContains` as it does through `page.waitForURL`, which is what the
change was for.

## 5. Align the Playwright handle where the port needed it

Both found by running 2.2, each one assertion further into the case.

- [x] 5.1 `getText` trims, as `WebElement.getText` does. `Locator.textContent` returns the raw node content, so the milestone name Gitea renders indented came back wrapped in newlines and tabs and failed a `toEqual`
- [x] 5.2 `IssuePage.getTitle` looks the index up at top level rather than scoped to the heading. A scoped find resolves the whole selector on Selenium and keeps the matches under the element; Playwright chains it relative to the element, so `#issue-title-display h1 .index` searched for the heading inside the heading

## 6. Read an attribute the way WebElement does

Found by running 2.2 after 5.2. `IssuePage.setDueDate` tries three spellings of the date and reads `getAttribute("value")` back to see which the input took. `Locator.getAttribute` reads the content attribute, which a date input set by the page never updates, so every spelling looked rejected and the second reached `fill()` as a malformed value and threw.

`playwright-organization-e2e` fixes the same divergence on the strategy's own `getAttribute`, for `value` only, through `inputValue()`. The element handle keeps the old reading, and `setDueDate` goes through the handle.

- [x] 6.1 Read the live property in the handle's `getAttribute`, falling back to the content attribute. Reading the property rather than calling `inputValue()` is what keeps `<progress value="50">` working, which the same case asserts on through the milestone list

## 7. Wrap up

- [x] 7.1 Document both specs and the fixture file in the `playwright-native` README
- [x] 7.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
- [x] 7.3 Run the whole `playwright-native` suite on firefox, 7 of 7 green, so the two handle changes leave the existing specs alone
