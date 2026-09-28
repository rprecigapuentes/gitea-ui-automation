## Why

The `@e2e` scenario of `organizations.feature`, "Change team members permissions", is the one
Cucumber case the Playwright suites had not both carried. `playwright-native` already runs it
(`organizations-e2e.spec.ts`); `playwright-bdd` does not. To compare the runners on it, it has to
run on the same Gherkin, in parallel, through the same page objects.

## What Changes

- `services/playwright-bdd` gains `organizations.feature`, copied byte for byte from the Cucumber
  service's `organizations.feature` for its `@e2e` scenario only, and the step definitions the
  scenario resolves to.
- Its fixture module gains `organizationsFixtures`, chained the way `playwright-native` chains it,
  so `seededUsers` ("user 1" and "user 2") exist for the scenario.
- `services/playwright-bdd/README.md` documents the feature.

Out of scope: the five `@smoke` scenarios of the same Cucumber file, which come one at a time;
`playwright-native`, which does not change; page objects, none of which this needs.

## Capabilities

### Modified Capabilities

- `playwright-bdd`: the requirement that a feature shared with the Cucumber service carries
  identical text generalises from the login feature alone to any feature this service shares with
  it, now that a second one exists.

## Impact

- `services/playwright-bdd/features/scenarios/`: one feature, new.
- `services/playwright-bdd/features/step-definitions/`: one step file, new.
- `services/playwright-bdd/fixtures/fixture.ts`: one fixture group added to the chain.
- `services/playwright-bdd/README.md`.

No page object, no client, no workflow and no change to any other service.
