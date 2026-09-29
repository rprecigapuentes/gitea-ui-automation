# Design

## Context

See proposal.md — Why. Two facts of the existing code decide most of this change.

`services/_shared/playwright/project-board.fixtures.ts` already describes itself as this feature's
`Background`: `seededOrganizationWithRepositories` creates the organization, two repositories and an
issue in each, and removes them again whether the scenario passed or failed; `kanbanProject` opens
the project on top of it. Both were written for `playwright-native`'s board specs and are shared.

The Cucumber service reaches the same state through `Before({ tags: "@project-board" })` and
`After({ tags: "@cleanup" })`, because Cucumber has no fixture teardown. `playwright-bdd` exposes
the same tag-scoped hooks through `createBdd`, so the choice between the two is open.

## Goals / Non-Goals

Goal: the five scenarios run on the same Gherkin the Cucumber service runs, over the fixtures
`playwright-native` already runs, so a difference between the three is a difference between the
runners and not between three different setups.

Non-goal: matching Cucumber's _mechanism_. Matching its feature text is required; matching how the
state gets there is not, and the two suites already differ — one seeds in a hook, the other in a
fixture.

## Decisions

### The `Background` is resolved by fixtures, not by tag-scoped hooks

A step declares the fixture it needs and Playwright resolves it before the scenario body; the
teardown runs even when the scenario fails. That is what a `Before`/`After` pair would have bought,
already written and already exercised by `playwright-native`.

Alternative considered: mirror Cucumber with `Before({ tags: "@project-board" })`. Rejected — it
would be a second implementation of a teardown that already exists, and the hooks would have to
duplicate what the fixture does to leave the instance clean.

Consequence worth recording: `organizationCleanupFixtures` stays out of this service's chain. Both
of its members are `auto`, so merging them would build the eight API clients for `login.feature` and
`create-issue.feature`, which never touch an organization. Here they would also find nothing to do —
the fixture clears `scenarioState.organization` before deleting.

### `I am logged in as the organization owner` establishes the session through the session manager

Cucumber's definition of this step drives the sign-in form. This service's will call
`sessionManager.loginAsOwner()`, as `create-issue.steps.ts` and
`playwright-native`'s `project-board-drag-and-drop.spec.ts` both do.

The feature text is unchanged — only the definition behind it differs, which is exactly what a step
definition is for.

Alternative considered: transcribe Cucumber's UI login faithfully. Rejected because it defeats the
purpose of the migration. `playwright-native`'s board specs pay no UI login; making the BDD ones pay
one would mean the two Playwright suites are no longer running the same case, and every timing
comparison between them would be measuring the sign-in form.

By the time the step runs, `kanbanProject` has already opened the session it needs, so the call is a
re-application rather than a first login. It is kept rather than dropped because the feature names
the precondition, and a step that names a precondition should assert or establish it.

## Risks / Trade-offs

- Drag and drop behaves differently on Firefox → already absorbed by `ProjectBoardPage.moveCard`,
  which falls back to a synthetic event sequence, and already green in `playwright-native`. Run
  Firefox immediately after Chrome so a regression points at the page object rather than the steps.
- A crashed run leaves an `at-board-*` organization behind, because this service has no pre-run
  sweep → observe it before building one. If a run leaves one, that is the evidence that decides
  where the sweep belongs.
- Near-identical step texts (`holds only the first` against `holds the first`) resolve ambiguously →
  the compilation step reports an ambiguous step by name before any browser starts.
