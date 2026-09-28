# Tasks

Each scenario is its own commit, so a regression in one is isolated from the rest.

## 1. Create a repository for an existing organization

- [x] 1.1 Append the scenario to `organizations.feature`, byte-identical to the Cucumber source.
      Add `Given("an organization already exists", ...)` on the `existingOrganization` fixture.
      Verify `bddgen` reports no undefined and no ambiguous step, and the scenario passes on chrome,
      firefox and edge.

## 2. Add a repository to a team

- [x] 2.1 Append the scenario. Export `Before` from `fixture.ts`'s `createBdd()` and add
      `Before({ tags: TEAM_REPOSITORY_TAG }, ...)` seeding `scenarioState.organization` from
      `seededOrganizationWithTeamAndRepository`. Verify the scenario passes on chrome, firefox and
      edge, and that `@e2e` and the first smoke still pass (the hook must not fire for them).

Passed on all three on the first run. The whole suite ran green on chrome afterward (6/6),
confirming the hook only fires for this scenario.

## 3. Create Organization

- [ ] 3.1 Append the scenario. No new step: it reuses the organization-creation steps `@e2e`
      already defines. Verify it passes on chrome, firefox and edge.

## 4. Create teams for an existing organization

- [ ] 4.1 Append the scenario. No new step. Verify it passes on chrome, firefox and edge.

## 5. Add a user to a team

- [ ] 5.1 Append the scenario. No new step. Verify it passes on chrome, firefox and edge.

## 6. Wrap up

- [ ] 6.1 Run the whole `playwright-bdd` suite on chrome, firefox and edge. Verify all nine pass and
      the instance carries no leftover organization or user afterward.
- [ ] 6.2 Document `organizations.feature`'s full coverage in `services/playwright-bdd/README.md`.
- [ ] 6.3 Run `npm run format:check`, `npm run lint` and `npm run typecheck`. Verify all three pass.
