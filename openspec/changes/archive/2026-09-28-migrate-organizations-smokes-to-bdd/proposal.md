## Why

`organizations.feature` in the Cucumber service carries five `@smoke` scenarios besides the `@e2e`
one `migrate-organizations-e2e-to-bdd` already ported. `playwright-native` runs all five
(`organizations-smokes.spec.ts`); `playwright-bdd` does not carry any of them yet, which is the last
gap between the three runners on this feature.

## What Changes

- `services/playwright-bdd/features/scenarios/organizations.feature` gains the five `@smoke`
  scenarios, copied byte for byte from the Cucumber service, appended after the `@e2e` one in the
  same order the source file carries them.
- One new step definition, `Given("an organization already exists", ...)`, using the
  `existingOrganization` fixture already chained into this service.
- One tag-scoped `Before({ tags: TEAM_REPOSITORY_TAG }, ...)` hook, seeding `scenarioState` for
  "Add a repository to a team" the way Cucumber's own `Before({ tags: "@team-repository" })` does —
  the first use of a tag-scoped hook in this service, alongside the fixture-only approach the
  `@e2e` scenario and `create-issue.feature` use.
- `services/playwright-bdd/README.md` records that `organizations.feature` now carries every
  scenario of its Cucumber counterpart.

Out of scope: `playwright-native`, which already has this coverage; page objects; the fixtures
themselves, all of which already exist.

## Capabilities

### Modified Capabilities

- `playwright-bdd`: `organizations.feature` becomes fully identical to its Cucumber counterpart,
  not only its `@e2e` scenario.

## Impact

- `services/playwright-bdd/features/scenarios/organizations.feature`: five scenarios appended.
- `services/playwright-bdd/features/step-definitions/organizations.steps.ts`: one step, one hook.
- `services/playwright-bdd/fixtures/fixture.ts`: `Before` added to what it exports from `createBdd`.
- `services/playwright-bdd/README.md`.
