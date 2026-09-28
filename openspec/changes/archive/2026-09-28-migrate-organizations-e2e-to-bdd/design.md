## Context

See proposal.md — Why. The behaviour is already recorded twice: the Cucumber `@e2e` scenario
itself, and `playwright-native`'s `organizations-e2e.spec.ts`, which ports it over the same page
objects and the same shared fixtures this service already depends on.

## Goals / Non-Goals

Goal: the same Gherkin, run on the same fixtures `playwright-native` runs, so a difference between
the two Playwright suites is a difference between the runners and not between three different
setups.

Non-goal: porting the other five scenarios of `organizations.feature`. They are smokes, ported one
at a time, matching how `playwright-native` itself split them into a separate change from the
`@e2e` one.

## Decisions

### The feature file carries only the `@e2e` scenario, not the whole Cucumber file

`organizations.feature` in Cucumber holds six scenarios: this one and five `@smoke`s. Copying the
whole file would mean generating step definitions for scenarios this change does not migrate,
which `bddgen` would report as undefined. The file here carries the Feature header and the `@e2e`
scenario only, character for character identical to the source through that point. A scenario
added later composes into the same file rather than a new one, the way Cucumber's own file grows.

### Step logic follows `organizations-e2e.spec.ts`, not the Cucumber TypeScript

The Gherkin text is Cucumber's, matched character for character. The page-object calls behind each
step are `playwright-native`'s already-proven Playwright sequence, not a fresh translation of the
Selenium step definitions — they differ in small ways proven necessary under Playwright (for
example, `orgFacade.open()` where Cucumber's Selenium version does the same through a different
fixture wiring). Where the Cucumber scenario reuses one step text several times ("I add a file to
each repository", "I login with valid credentials as user {int}"), the step definition is the
generic, state-driven version Cucumber itself uses — reading and writing `scenarioState`, rather
than `playwright-native`'s three separately-written occurrences — because one BDD definition serves
every occurrence of that text.

### `organizationsFixtures` is chained, not reinvented

`seededUsers`, along with `SMOKE_TAG`/`TEAM_REPOSITORY_TAG`/`E2E_TAG`, already exists in
`@gitea-automation/shared-playwright/organizations.fixtures`, built for exactly this scenario and
already exercised by `playwright-native`. It is added as its own `.extend()` group in
`fixture.ts`, beside the organization cleanup group `migrate-organizations-to-bdd` added.

## Risks / Trade-offs

- Running the scenario on chrome and edge left an `at-user-1-<browser>-*` account behind after a
  passing run, on both a solo run and a full-suite run, while firefox left nothing; `at-user-2-*`
  was never left behind. The instance already carried the same pattern from `playwright-native`'s
  own runs going back to before this change existed, so the defect is in
  `shared-playwright/organizations.fixtures.ts`'s `seededUsers` teardown (or in what Gitea does
  when deleting a user still on a team's roster — "user 1" is never fully removed from every team
  before the scenario ends, "user 2" always is), not in anything this change adds. Fixing it is out
  of scope: it is shared with `playwright-native`, and this change's own assertions do not depend
  on the teardown succeeding. Flagged separately rather than fixed here.
