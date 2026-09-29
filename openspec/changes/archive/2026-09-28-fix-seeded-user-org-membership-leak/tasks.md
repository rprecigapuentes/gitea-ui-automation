# Tasks

## 1. Reproduce against the API

- [x] 1.1 Create a user, an organization, a team, add the user to the team, and attempt
      `DELETE /admin/users/{username}` while the membership stands. Verify it returns 422 with
      `"user still has membership of organizations"`, and that removing the membership (or deleting
      the organization) first makes the same delete succeed.

## 2. Fix the fixture

- [x] 2.1 Add `getOrganizationsForUser` and `removeMember` to `OrganizationClient`. Verify with
      `npm run typecheck`.
- [x] 2.2 In `seededUsers`' teardown, leave every organization each seeded user is still a member of
      before deleting them. Verify `npm run lint` is green.

## 3. Prove the leak is gone

- [x] 3.1 Snapshot the instance's `at-user-*` accounts (paginated — the instance holds more than one
      page). Run "Change team members permissions" on `playwright-bdd`'s chrome, firefox and edge,
      and on `playwright-native`'s chrome. Verify the snapshot is unchanged after each run.
- [x] 3.2 Run the whole `playwright-bdd` suite on chrome, firefox and edge, and the whole
      `playwright-native` suite on chrome. Verify nothing regresses.

Ran 1.1 directly against the API before touching any code, confirming the exact failure and its
fix. After the change, 3.1 held across four runs (three browsers of `playwright-bdd`, one of
`playwright-native`) with zero new accounts each time — the same scenario that leaked on every
prior run, going back two weeks, left nothing behind. 3.2: `playwright-bdd` 12/12 across three
browsers; `playwright-native` 15/16 on chrome, the one failure (`scoped-labels.spec.ts`, unrelated
to organizations or users) passing alone on retry — a pre-existing load-sensitive flake, not
touched by this change.
