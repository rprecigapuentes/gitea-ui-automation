## 1. Seed fixtures

- [ ] 1.1 Add `repository`, `issue`, `maintainer`, `classificationLabel` and `milestone` to `fixtures/issues-fixtures.ts`, deriving the browser from `testInfo.project.name` where Vitest reads `process.env.BROWSER`

## 2. Port AT-ISS-01

- [ ] 2.1 Write `tests/issue-metadata.spec.ts` against `pageObjects`, with no assertion dropped
- [ ] 2.2 Run it on chrome, firefox and edge, alone and with `test:parallel`

## 3. Port AT-ISS-02

- [ ] 3.1 Write `tests/scoped-labels.spec.ts` against `pageObjects`, with no assertion dropped
- [ ] 3.2 Run it on chrome, firefox and edge, alone and with `test:parallel`

## 4. Agree on what a URL wait means

Found while reading the two strategies before 2.1: `IssueListPage.filterByLabel` waits on the string `labels=<id>`, which `until.urlContains` matches as a substring and `page.waitForURL` matches as a glob against the whole URL. Reproduced outside Gitea against a `file://` URL carrying a query string: the string times out, a predicate and a regex both match. `filterByMilestone`, one line below, already waits on a regex.

- [ ] 4.1 Make `filterByLabel` wait on the regex `labels=<id>(&|$)` instead, the form both strategies read the same way
- [ ] 4.2 Confirm the Vitest suite still passes, since the page object is shared

## 5. Wrap up

- [ ] 5.1 Document both specs and the fixture file in the `playwright-native` README
- [ ] 5.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
