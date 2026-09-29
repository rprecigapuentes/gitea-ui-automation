## Why

A trend report that sums the four suites' totals for comparison counted "Selenium" at 17
(`gitea-selenium-vitest`'s 4 plus `gitea-selenium-cucumber`'s 13), one more than `playwright-native`
and one more than `playwright-bdd` will have once AT-ISS-01/02 land — because Vitest's own login
test and Cucumber's own login feature both exercise the same login flow, and each suite counts it.
Cucumber's copy stays: `playwright-bdd/features/scenarios/login.feature` is required to be
byte-identical to it (`openspec/specs/playwright-bdd/spec.md`), so it is the one with a real
consumer. Vitest's copy has none.

`playwright-bdd`'s `create-issue.feature` was authored only to prove the Playwright agent
generator could emit a working step-definition file (`generate-bdd-step-definitions`, task 4.2),
not as coverage this suite is meant to keep: its ground ("an issue is created with a title and a
description") is a strict subset of AT-ISS-01, not yet ported here.

## What Changes

- `gitea-selenium-vitest/tests/login.test.ts`'s test is marked `test.skip`, not deleted: it is still
  the place a Selenium+Vitest-specific login regression would show if someone un-skips it.
- `playwright-bdd/features/scenarios/create-issue.feature`'s scenario is tagged `@skip`, and every
  browser project's `defineBddProject` is given `tags: "not @skip"`, so `bddgen` never compiles a
  test for it. The feature and its step definitions stay on disk.
- Both take effect through the same `npm test` command the pipeline already runs — no workflow file
  changes.

Out of scope: `gitea-selenium-cucumber`'s login feature, which stays; deleting `create-issue.feature`
outright, left for whenever AT-ISS-01 actually lands here; the trend report script itself
(untracked, not part of this repo), whose Vitest-summary parser does not yet recognise a "skipped"
count and may still misreport the total until someone teaches it to.

## Capabilities

No requirement text changes — which scenarios run is not a behavior contract this repo's specs
describe. `skip_specs: true`.

## Impact

Modified: `services/gitea-selenium-vitest/tests/login.test.ts`,
`services/playwright-bdd/features/scenarios/create-issue.feature`,
`services/playwright-bdd/playwright.config.ts`.
