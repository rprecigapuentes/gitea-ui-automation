## Why

`organizations.test.ts` (Vitest) took ~48.5s per run, well above its Cucumber counterpart for similar coverage. Allure's per-step timings pinned the cost to two things: a "log in as user 2, open the org dropdown, log out" block at the very start that has nothing to do with the test's own title ("should create an organization and add members") or its `scenarioState`, and four "return to Teams" checkpoints that each re-verified every team's member count, avatar count, avatar usernames and add-member-link state - each property lookup re-scans the team-card list from scratch.

Confirmed live: batching those lookups behind one container fetch (tried both `Promise.all` and sequential awaits) made the same checkpoints _slower_, not faster (7s → 9.5-9.8s) - so the round-trip count wasn't the bottleneck. Removing the avatar-count/avatar-username assertions specifically (`getTeamAvatarsCount`/`hasTeamAvatar`, which resolve `<img>` elements) is what actually cut it: the same checkpoints dropped from 7s to 0.4-3.5s. The member-count text checks that remained are effectively free by comparison.

## What Changes

- Drop the "Invited user: Login / Logout" block - unrelated to what this test creates or asserts.
- Collapse the repeated `isTabSelected` + 5x `isTabNotSelected` chains down to the one `isTabSelected` check that matters at each point.
- Drop the avatar-count and avatar-username assertions from the four "return to Teams" checkpoints, keeping the member-count text and add-member-link checks, which is what regresses if team membership actually breaks. The avatar checks stay in the two spots that first establish that state (`Navigate to Teams`, `Return to Teams after adding user 2`'s new-member avatar).

## Impact

`services/gitea-selenium-vitest/tests/organizations.test.ts` only - no page-object or fixture changes. ~48.5s -> ~22-25s per run (3 consecutive runs), full `test:chrome` suite (4 files) still green, no flaky locators surfaced.
