## Why

The suites run the same cases on purpose, so the frameworks can be compared. The organizations case,
"should create an organization and add members", is written twice already: in `gitea-selenium-vitest`
and in `playwright-native`'s `organizations-e2e.spec.ts`. `playwright-bdd` does not have it.

The Cucumber service has no feature to copy. Its `organizations.feature` carries the
permissions scenario and the smokes, not this journey, so the Gherkin is authored here, from the
assertions the Vitest case makes.

It is also the first scenario of this service that creates an organization through the browser. The
`create-issue` scenario seeds through fixtures and leaves nothing of its own to remove, so nothing
yet decides how this service cleans up after a scenario that does.

## What Changes

- `services/playwright-bdd` gains `create-organization.feature`, one scenario tagged `@organization`,
  keeping every assertion of the Vitest case, and the step definitions it resolves to, written by
  the Playwright generator.
- Its fixture module gains `organizationCleanupFixtures`, chained the way
  `playwright-native/fixtures/fixture.ts` chains them, so an organization the scenario creates is
  removed afterwards and a crashed run's leftovers are swept before it.
- `services/playwright-bdd/README.md` documents the feature and the cleanup.

Out of scope: page objects, none of which this needs; `playwright-native`, which does not change;
the Cucumber features; the organization smokes and the permissions scenario, which come one at a
time; `organizationsFixtures`, which no step here declares; and a sweep for organizations left by
an agent's exploration session.

## Capabilities

### Modified Capabilities

- `playwright-bdd`: a scenario that creates an organization through the browser leaves none behind,
  passed or failed.

## Impact

- `services/playwright-bdd/features/scenarios/`: one feature, new.
- `services/playwright-bdd/features/step-definitions/`: one step file, new.
- `services/playwright-bdd/fixtures/fixture.ts`: one fixture group added to the chain.
- `services/playwright-bdd/README.md`.

No page object, no client, no workflow and no change to any other service.
