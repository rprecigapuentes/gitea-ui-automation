# Proposal

## Why

The Cucumber suite has five organization smokes that the Playwright service does not. To compare the runners on the same scenarios, they have to run on Playwright, on the same browsers, in parallel, through the same page objects.

## What Changes

- Add `tests/organizations-smokes.spec.ts` to `services/playwright-native`, one test per smoke of `organizations.feature`, in the same order and with the same steps and assertions: create an organization, create a team, add a user to a team, create a repository, add a repository to a team.
- Add the two starting states the smokes rely on as fixtures in `fixtures/hooks-fixtures.ts`, mirroring the Cucumber hooks: an existing organization ("an organization already exists") and an organization with a team and a repository, tagged `@team-repository`. `cleanupCreatedOrganization` already tears both down.
- "Add a user to a team" uses the invited account of the browser as the user, since the Playwright job has no admin token to seed users with.
- Land it in three commits: two smokes each, the last with the one left.

## Capabilities

No requirement text changes: existing scenarios are ported to a runner that already has its fixture layer. `skip_specs: true`.

## Impact

New: `services/playwright-native/tests/organizations-smokes.spec.ts`. Modified: `services/playwright-native/fixtures/hooks-fixtures.ts`, `services/playwright-native/README.md`.

## Out of Scope

- The `@e2e` scenario "Change team members permissions" (its Playwright port lives in `organizations-e2e.spec.ts`) and the other features.
- A Gherkin layer: the smokes are plain Playwright tests, and `playwright-bdd` stays reserved.
- Changes to page objects or the strategies, unless a step fails on Playwright for a reason only they can fix.
