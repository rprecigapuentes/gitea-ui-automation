## 1. Seed fixtures

- [x] 1.1 Add `repository`, `issue`, `maintainer`, `classificationLabel` and `milestone` to `fixtures/issues-fixtures.ts`, deriving the browser from `testInfo.project.name` where Vitest reads `process.env.BROWSER`

## 2. Port AT-ISS-01

- [x] 2.1 Write `tests/issue-metadata.spec.ts` against `pageObjects`, with no assertion dropped
- [ ] 2.2 Run it on chrome, firefox and edge, alone and with `test:parallel`

Passes on firefox once `playwright-organization-e2e`'s `getAttribute` fix is applied, verified by cherry-picking `36e05d8` onto this branch. On this branch alone it still fails, see section 6. Chrome and edge are unrun: the branded browsers are not installed on this machine, only bundled Chromium and Firefox.

## 3. Port AT-ISS-02

- [x] 3.1 Write `tests/scoped-labels.spec.ts` against `pageObjects`, with no assertion dropped
- [ ] 3.2 Run it on chrome, firefox and edge, alone and with `test:parallel`

Passes on firefox on this branch. Chrome and edge unrun, same reason.

## 4. Agree on what a URL wait means

Found while reading the two strategies before 2.1: `IssueListPage.filterByLabel` waits on the string `labels=<id>`, which `until.urlContains` matches as a substring and `page.waitForURL` matches as a glob against the whole URL. Reproduced outside Gitea against a `file://` URL carrying a query string: the string times out, a predicate and a regex both match. `filterByMilestone`, one line below, already waits on a regex.

- [x] 4.1 Make `filterByLabel` wait on the regex `labels=<id>(&|$)` instead, the form both strategies read the same way
- [ ] 4.2 Confirm the Vitest suite still passes, since the page object is shared

## 5. Align the Playwright handle where the port needed it

Both found by running 2.2, each one assertion further into the case.

- [x] 5.1 `getText` trims, as `WebElement.getText` does. `Locator.textContent` returns the raw node content, so the milestone name Gitea renders indented came back wrapped in newlines and tabs and failed a `toEqual`
- [x] 5.2 `IssuePage.getTitle` looks the index up at top level rather than scoped to the heading. A scoped find resolves the whole selector on Selenium and keeps the matches under the element; Playwright chains it relative to the element, so `#issue-title-display h1 .index` searched for the heading inside the heading

## 6. Wait on the organization change for the third alignment

`IssuePage.setDueDate` tries three spellings of the date and reads `getAttribute("value")` back to see which one the input took. `Locator.getAttribute` reads the content attribute, which a date input set programmatically does not carry, so every spelling looks rejected and the second one reaches `fill()` as a malformed value and throws.

The fix already exists as `readAttribute` in `playwright-organization-e2e` (`36e05d8`). Duplicating it here would conflict in the same function, so this change waits instead.

- [ ] 6.1 Rebase on main once `playwright-organization-e2e` lands, then rerun 2.2

## 7. Wrap up

- [x] 7.1 Document both specs and the fixture file in the `playwright-native` README
- [x] 7.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
