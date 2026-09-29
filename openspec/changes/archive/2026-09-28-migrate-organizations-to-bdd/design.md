## Context

See proposal.md — Why. The behaviour of the case is already recorded in two places, so the
`playwright-test-planner` is not sent to look at Gitea again: the Vitest case's thirteen steps and
their assertions, and `playwright-native`'s `organizations-e2e.spec.ts`, which ports them one for
one over the same page objects and the same shared fixtures.

The fixture module of this service carries a comment predicting that the organization groups arrive
"as tag-scoped hooks with the first scenario that seeds an organization". This is the first scenario
that creates an organization, and it creates it through the browser rather than seeding it, so the
choice that comment deferred is made here.

## Goals / Non-Goals

Goal: the same case, in the same three browsers, over the same fixtures `playwright-native` runs, so
a difference between the two Playwright suites is a difference in how the case is written and not in
how it is set up or torn down.

Non-goal: matching the Cucumber suite's mechanism. Its `@cleanup` hook exists because Cucumber has no
fixture teardown.

## Decisions

### Cleanup is the fixture `playwright-native` already runs, not a tag-scoped hook

`organizationCleanupFixtures` removes what `scenarioState.organization` names, after the scenario
and whether it passed, and sweeps a crashed run's leftovers before a test carrying
`ORGANIZATION_TAG`. `playwright-native` chains it in its own `fixture.ts`; this service chains it
the same way, so the two suites tear down identically.

Alternative considered: `After({ tags: "@organization" })` and `Before` hooks, as the Cucumber suite
does. Rejected — it would be a second implementation of a teardown that is already written and
exercised, and it would have to reproduce the repository deletion Gitea requires before it accepts an
organization's deletion.

Cost, stated because a sibling change left this group out for it: both members are `auto`, so every
scenario of the service now builds the eight API clients, `login` included, which today never does.
Building them issues no request, since the clients are constructors over a strategy, and the sweep
reads `testInfo.tags` before it calls anything, so only a tagged scenario pays for an API call.

### The scenario is tagged in the feature, and the tag has to reach `testInfo`

The sweep keys on `ORGANIZATION_TAG`. In `playwright-native` that is `{ tag }` on the test; here the
tag lives in the `.feature`, so the task that proves the cleanup also proves `playwright-bdd`
surfaces a feature's tag in `testInfo.tags`.

### The organization is generated in a step, the teams are named by the feature

The organization takes `ORGANIZATION_NAME_PREFIX` plus the project and a unique suffix, exactly as
`playwright-native` names it, because the sweep matches on that prefix, and it travels to the steps
that read it through `scenarioState`, never through a module variable: parallel workers share the
file and not the state.

The teams are named in the feature (`"team-1"`, `"team-2"`, and the default `"Owners"`) and a step
passes the name straight to the page object, as the Cucumber suite does with `dev-team`. A team
name only has to be unique inside its organization, and the organization is unique per run, so
`playwright-native`'s generated suffix on a team buys nothing here. It also means no step needs a
lookup to turn a label into a name, which keeps each definition readable on its own.

Counts are bare numbers in the feature. The step decides what a number stands for: the text Gitea
renders (`1 members`) is built in the definition, not written in the Gherkin.

Step definitions carry their logic inline and define no helper functions.

### The invited account is resolved where it is used

`playwright-native` calls `resolveInvitedCredentials(testInfo.project.name)` in the test. The steps
here do the same through `$testInfo`, so this change adds no fixture beyond the cleanup group. The
owner comes from the `ownerCredentials` fixture the service already has.

## Risks / Trade-offs

- `127-migrate-cases` also extends this service's fixture chain, with the organization and
  project-board groups → the conflict is in one file and is a union of imports and `.extend()`
  calls. Whichever lands second resolves it; neither change depends on the other.
- The generator's exploration creates an organization in the browser and its starting state stays
  paused, so its teardown never runs → name the exploration's organization under the sweep's prefix,
  so the next tagged run removes it, and confirm none survives after the final run.
- Two definitions matching one step make the run fail as ambiguous → the labels and counts are
  parameters of a small number of steps rather than one definition per assertion, and `bddgen`
  reports any ambiguity by name before a browser starts.
