## Why

`migrate-organizations-smokes-to-bdd` gave "Add a repository to a team" a `Before({ tags:
TEAM_REPOSITORY_TAG }, ...)` hook to seed `scenarioState` before its first step, because declaring
`seededOrganizationWithTeamAndRepository` on a step this scenario shares with `@e2e` — every step it
has is shared — resolves that fixture for `@e2e` too, seeding an organization nobody there asks for.
A hook duplicates what the fixture already builds, and this repository's own `organizationCleanupFixtures.cleanupOrganizationsBeforeRun` already solves the identical problem — "only for a scenario
carrying this tag" — as a fixture, not a hook.

## What Changes

- `seededOrganizationWithTeamAndRepository` becomes `auto`, gated on `testInfo.tags.includes(TEAM_REPOSITORY_TAG)`
  exactly as `cleanupOrganizationsBeforeRun` is gated on `ORGANIZATION_TAG` — a no-op for every
  scenario that doesn't carry the tag, so a step it shares with `@e2e` costs `@e2e` nothing.
- It also populates `scenarioState.organization.teams` and `.repositories`, which
  `playwright-native`'s own test never reads (it uses the fixture's returned value directly) but
  `playwright-bdd`'s shared step definitions do, the same way Cucumber's own `Before` hook for this
  tag populates both.
- The `Before` hook and its imports are removed from `organizations.steps.ts`; `Before` is no
  longer exported from `fixture.ts`, unused now.
- `seededOrganizationWithTeamAndRepository`'s type widens to include `null`, since the fixture now
  always runs; `playwright-native`'s own test asserts it non-null with `!`, as elsewhere in this
  codebase.

## Capabilities

No requirement text changes — an implementation correction to a fixture `migrate-organizations-smokes-to-bdd` already covers. `skip_specs: true`.

## Impact

Modified: `services/_shared/playwright/organizations.fixtures.ts`,
`services/playwright-native/tests/organizations-smokes.spec.ts`,
`services/playwright-bdd/features/step-definitions/organizations.steps.ts`,
`services/playwright-bdd/fixtures/fixture.ts`.
