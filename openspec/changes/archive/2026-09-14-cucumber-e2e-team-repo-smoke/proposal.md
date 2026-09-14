## Why

The team-repository assignment flow only had e2e coverage, bundled behind a full org+teams+members+repos build. A smoke needs to isolate just that action, cheaply - the org, the team and the repo don't need the UI at all to exist, only the assignment does. Following the `@project-board` precedent already in `hooks.ts`, that seeding belongs in a tag-scoped `Before` hook rather than in per-scenario `Given` steps.

## What Changes

- New `TeamClient.createTeam()` (API) for team setup outside the UI, added to `hooks.ts`'s `ownerClients()`.
- A `@team-repository`-tagged `Before` hook seeds an organization, a team and a repository via API, mirroring `@project-board`'s shape.
- One `"the seeded organization is open"` step just opens the browser on it; a new `@smoke` scenario assigns the seeded repository to the seeded team, reusing the `When`/`Then` steps built for the e2e flow.

## Impact

`business-logic/selenium/api/clients/team.client.ts` (new); `services/gitea-selenium-cucumber/features/support/hooks.ts`, `features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`.
