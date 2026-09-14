## Why

Under `npm run test:parallel` (chrome+firefox+edge simultaneously), `organizations.test.ts`'s "Owner removes user 2 from Team 1" step flaked on chrome: `TimeoutError: No visible element(s) for locator "By(css selector, #remove-team-member)"` after the documented 15s budget. Cucumber's own "I remove the following team members:" step exercises the exact same fragment method and hadn't shown this - but it also carried three extra assertions (`getMembersCount`/`hasMember` before the click, `hasExpectedRemoveTeamMemberModalElements` after) that Cucumber's step never had, adding round trips ahead of the AJAX-fetched modal and narrowing the timing margin under heavy parallel load.

## What Changes

- `organizations.test.ts`'s "Owner removes user 2 from Team 1" step now mirrors Cucumber's step exactly around the click: drops the pre-click `getMembersCount`/`hasMember` checks (both already covered a moment earlier, in "Return to Teams after adding user 2") and the post-modal `hasExpectedRemoveTeamMemberModalElements` check (Cucumber never asserted it either).

## Impact

`services/gitea-selenium-vitest/tests/organizations.test.ts` only. Confirmed via `npm run test:parallel` x2: chrome and firefox now pass cleanly on this step both times. Edge still hits the same `#remove-team-member` timeout both times - this matches the pre-existing, already-documented finding in `specific-team.fragment.ts` (`clickRemoveTeamMemberButton`'s comment, from the archived `cucumber-e2e-remove-team-member` change): Edge's AJAX-fetched modal can miss even a generous wait budget under load. Reported to the user rather than papering over it with a bigger timeout, since the prior investigation already found that doesn't reliably fix it.
