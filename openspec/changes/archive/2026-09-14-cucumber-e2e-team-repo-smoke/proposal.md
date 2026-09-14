## Why

The team-repository assignment flow only had e2e coverage, bundled behind a full org+teams+members+repos build. A smoke needs to isolate just that action, cheaply - the org, the team and the repo don't need the UI at all to exist, only the assignment does.

## What Changes

- New `TeamClient.createTeam()` (API) for team setup outside the UI.
- Two new `Given` steps, `"a team named {string} already exists"` and `"a repository named {string} already exists"`, both API-backed and state-tracked like `"an organization already exists"`.
- A new `@smoke` scenario assigns one already-existing repository to one already-existing team, reusing the `When`/`Then` steps built for the e2e flow.

## Impact

`business-logic/selenium/api/clients/team.client.ts` (new); `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`.
