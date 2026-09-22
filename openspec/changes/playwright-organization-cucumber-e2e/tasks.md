## 1. Seeded users

- [x] 1.1 Add `resolveAdminToken` to `fixtures/credentials.ts`
- [x] 1.2 Add the `seededUsers` fixture to `fixtures/hooks-fixtures.ts`

## 2. Pipeline

- [x] 2.1 Mint the admin token in the `playwright-native` job of `ct.yml` and prove it holds `write:admin`

## 3. The scenario

- [x] 3.1 Port "Change team members permissions" to `tests/organizations-e2e.spec.ts`
- [x] 3.2 Run it on chrome, firefox and edge, alone and with `test:parallel`. It exposed that `isVisible` had no default timeout and waited for the test's own; it now waits 5 seconds like Selenium

## 4. Review fixes

- [x] 4.1 `resolveAdminToken` reads the env var directly, no throw; the test carries no helper functions, everything inline behind `test.step`
- [x] 4.2 Removing the config timeout reproduced the original failure exactly (30s default, the same locator hung past it), confirming it, not something else, was the cause; restored it. Inlining also surfaced a missed `navigateToTeamsTab()` between two team switches, and a wrong expected count (qa-team keeps user1 after user2 is removed, so "1 members" not "0") — both fixed
- [x] 4.3 Re-ran on chrome, firefox and edge, alone and with `test:parallel`, twice: 12/12 each run. One `test:parallel` run flaked once on edge (`fillFileName` losing its first keystrokes under the three browsers' shared load) and passed standalone and on the next parallel run — the same class of load-sensitive flake other suites' comments already document, left alone here

## 5. Wrap up

- [x] 5.1 Document the spec and the fixture in the README
- [x] 5.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green

## 6. Rename and merge

- [x] 6.1 Merge this test into `organization.spec.ts` (the Vitest one), rename the result to `tests/organizations-e2e.spec.ts`, and rename `organization-smokes.spec.ts` to `organizations-smokes.spec.ts` — matching the plural `organizations` the Vitest and Cucumber suites already use. Each test in the merged file carries a one-line `// Vitest`/`// Cucumber` comment naming which suite it replicates
- [x] 6.2 Update the README and the three proposals' file references
- [x] 6.3 Re-run `npm run lint`, `npm run typecheck` and the full functional suite on chrome, firefox and edge

## 7. Merge with the hooks-fixtures retirement

`playwright-project-board-smoke` retired `fixtures/hooks-fixtures.ts` (task 4 there): the two automatic cleanups moved to `fixture.ts`, the board seed to `project-board-fixtures.ts`. Its author only knew of `organization.spec.ts`, not the smokes and this scenario added afterwards, so their org-domain fixtures had no home in that split.

- [x] 7.1 Add `fixtures/organizations-fixtures.ts`, extending `fixture.ts`: `existingOrganization`, `seededUsers`, `seededOrganizationWithTeamAndRepository`, and `SMOKE_TAG`/`TEAM_REPOSITORY_TAG`/`E2E_TAG`. It re-exports `ORGANIZATION_TAG`/`ORGANIZATION_NAME_PREFIX` from `fixture.ts` so a spec still needs one import
- [x] 7.2 Point `organizations-e2e.spec.ts` and `organizations-smokes.spec.ts` at it; document it in the README next to `project-board-fixtures.ts`
- [x] 7.3 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green, and the full `playwright-native` suite passes on chrome, firefox and edge

7.3's first run found `getText`'s scoped path (`toElementHandle`, resolving the conflict this merge had on it) had picked `Locator.innerText().trim()` over `main`'s `Locator.textContent().trim()`. Both sides fixed the same whitespace bug for a different caller — `getDropdownOrganizationsList()` here, `IssuePage.getDueDate()` on `main` — and `innerText` failed the second: `.due-date` returned empty text at the moment it read, something `textContent` doesn't require a completed layout for. Re-ran `organizations-e2e.spec.ts` with `textContent` to confirm no regression, then made the top-level `getText` match it too, for one behaviour instead of two. 18/18 on all three browsers, twice.
