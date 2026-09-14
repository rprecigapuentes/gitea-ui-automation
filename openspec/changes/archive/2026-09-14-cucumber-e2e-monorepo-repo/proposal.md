## Why

The `@e2e` flow no longer needs two separate per-team repositories - one repository shared by both teams from creation covers the same ground with less setup, data-only since the steps already handle arbitrary rows.

## What Changes

- `@e2e`'s `frontend`/`backend` repositories are replaced by a single `monorepo`, created once and assigned to both `dev-team` and `qa-team`.

## Impact

`services/gitea-selenium-cucumber/features/scenarios/organizations.feature` only.
