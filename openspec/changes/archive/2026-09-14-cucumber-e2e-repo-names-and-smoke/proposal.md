## Why

"the repositories were created successfully" only checks a count so far. Confirmed live: `.flex-divided-list.items-with-main` on the Repositories tab is the org's repo list, each `.item` holding the repo name directly at `.item-title a.name`.

## What Changes

- `OrgRepositoriesFragment` gains `getRepositoryNames()`, same shape as `OrgTeamsFragment.getTeamNames()`: find the container, its `.item` children, read each one's name link (`.item-title a.name`).
- `"the repositories were created successfully"` also asserts every created repository's name is among them.
- A new `@smoke` scenario creates one repository from an already-existing organization, no team involved - reusing every step already built.

## Impact

`business-logic/selenium/ui/pages/organizations/fragments/org-repositories.fragment.ts`; `services/gitea-selenium-cucumber/features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`.
