## Why

`@e2e` ended with a trailing `When I logout` / `And I login with valid credentials as "owner"` after its last `Then`, left over from mirroring earlier re-login checkpoints in the scenario. Nothing after the final assertion reads the UI session again - the `@cleanup` teardown deletes the organization through the owner's API token, not the browser - so those two steps were dead weight.

## What Changes

- `@e2e` now ends at `Then the organization is no longer accessible`.

## Impact

`services/gitea-selenium-cucumber/features/scenarios/organizations.feature`.
