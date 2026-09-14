## Why

`SpecificTeamFragment.clickRemoveTeamMemberButton()` waits up to 15s for the AJAX-fetched confirmation modal after clicking the remove-member button. Under `npm run test:parallel` (chrome+firefox+edge running simultaneously against the same local Gitea instance), that budget can run out even though the click landed - only surfaces under 3-way concurrent load, never in a single-browser run.

A first attempt (blind click retry on any timeout) made things worse: confirmed live, a second click can land on the `.ui.dimmer.active` overlay the first click's modal is mid-transition into, throwing `ElementClickInterceptedError` instead of the original timeout - proof the first click _had_ landed and the modal was just slow, not stalled.

Confirmed live over 4 `test:parallel` runs with the fixed retry: organizations.test.ts passed 3/4 times outright, and the one remaining failure moved from edge to chrome between runs - not an edge-specific driver quirk as originally suspected, but host-level resource contention when 3 real browsers hammer one local Gitea instance at once. A client-side retry measurably helps but can't fully eliminate a server response that occasionally takes longer than any bounded wait under that load.

## What Changes

- `clickRemoveTeamMemberButton()`: on the first `clickAndWaitFor` timeout, re-click once with no wait: an `ElementClickInterceptedError` there means the modal is already opening (the dimmer is what's blocking the click), so just wait for it; any other outcome from the re-click (success or a different error) falls through the same way, then a second, full-budget wait for the modal.

## Impact

`business-logic/selenium/ui/pages/organizations/fragments/specific-team.fragment.ts` only - shared by both Cucumber and Vitest. Cucumber's `@e2e` (which exercises the same method via "I remove the following team members:") stayed clean across 2 runs (63/63 steps). `npm run test:parallel` improved from a reproducible edge failure to passing 3 of 4 runs; the residual failure is cross-browser resource contention under full 3-way parallel load, not something a click retry can fully absorb - reported to the user rather than claimed as fully fixed.
