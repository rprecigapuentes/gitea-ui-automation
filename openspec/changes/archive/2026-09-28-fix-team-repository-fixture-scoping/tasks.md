# Tasks

## 1. Verify the Before hook actually leaks

- [x] 1.1 Add `seededOrganizationWithTeamAndRepository` to the shared step "the seeded organization
      is open" experimentally, run `bddgen`, and inspect the generated `@e2e` test's fixture list.
      Verify it now includes the fixture, confirming a step shared with `@e2e` cannot declare it
      without seeding an unwanted organization there. Revert the experiment.

Confirmed: `@e2e`'s generated fixture list gained `seededOrganizationWithTeamAndRepository` the
moment the shared step declared it.

## 2. Make the fixture auto and tag-gated

- [x] 2.1 In `services/_shared/playwright/organizations.fixtures.ts`, make
      `seededOrganizationWithTeamAndRepository` an `[fn, { auto: true }]` tuple that no-ops unless
      `testInfo.tags.includes(TEAM_REPOSITORY_TAG)`, mirroring `cleanupOrganizationsBeforeRun`. Widen
      its type to include `null`. Populate `scenarioState.organization.teams` and `.repositories` in
      the seeding branch. Update `organizations-smokes.spec.ts`'s one read site with `!`.
      Verify `npm run typecheck` and `npm run lint` are green.

## 3. Remove the hook

- [x] 3.1 Delete the `Before` hook and its imports from `organizations.steps.ts`; drop `Before` from
      `fixture.ts`'s `createBdd()` destructuring. Verify `bddgen` still reports no undefined and no
      ambiguous step, and that `@e2e`'s generated fixture list no longer carries
      `seededOrganizationWithTeamAndRepository`.

## 4. Prove it

- [x] 4.1 Run "Add a repository to a team" on chrome, firefox and edge. Verify all three pass — the
      first attempt failed (`scenarioState.organization.teams` was undefined, since the fixture
      hadn't been given the teams/repositories population yet); fixed in task 2, then all three
      passed.
- [x] 4.2 Run the whole `playwright-bdd` suite on chrome, firefox and edge, and the whole
      `playwright-native` suite on chrome. Verify all twenty-seven plus sixteen pass, and that a
      paginated, admin-token check of the instance shows no new `at-user-*` or `at-team-repo-*`
      account after any of them.

27/27 and 16/16. The instance also carried 26 `at-team-repo-*` organizations predating this
session; four more fresh runs of this scenario after the fix left the count unchanged each time,
confirmed by a full paginated listing, so they were deleted as stale debris rather than left as
ambiguous evidence of an ongoing leak.
