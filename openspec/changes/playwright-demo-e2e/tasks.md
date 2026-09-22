## 1. Compose the state the scenario starts from

- [x] 1.1 Give `SeededUser` the `id` `UserClient.createUser` already returns, in `fixtures/organizations-fixtures.ts`; verify the organization specs that read the fixture are unaffected
- [x] 1.2 Chain `fixtures/project-board-fixtures.ts` onto `fixtures/organizations-fixtures.ts`; verify the two board specs pass unchanged, which is what says the added fixtures never run for a test that does not ask for them
- [x] 1.3 Add `seededMilestone` to `fixtures/project-board-fixtures.ts`, on the seeded organization's first repository, due in seven days as the Cucumber hook sets it; verify the board specs are unaffected
- [x] 1.4 Record the organization in `scenarioState` from `seededOrganizationWithRepositories`, and clear it before deleting

`PageFactory` throws `organization is not set in scenarioState` when it is missing, so the facade cannot be opened without 1.4. Clearing it in the fixture's own teardown is what keeps `cleanupCreatedOrganization`, which tears down after it, from deleting an organization that is already gone.

## 2. Port the scenario

- [x] 2.1 Write `tests/demo-e2e.spec.ts` through the phase that adds a column to the board, through `pageObjects` only, and verify it passes on firefox with no assertion dropped against `demo-e2e.feature`
- [x] 2.2 Add the phases that drag the cards and delete the column they were dragged into, and verify they pass
- [x] 2.3 Add the phases that close and reopen the issue and read the milestone, and verify they pass
- [x] 2.4 Add the phase that signs in as the member, and verify it passes

2.2 is the phase the first attempt at this port failed on, so it is split from the rest rather than written in one pass.

The failure was `deleteColumn` waiting out the test timeout on the delete item of the column the test had added, which is in the DOM and has no box because its menu never opened. What the probes measured, on firefox:

- The five columns are identical. Same `class="ui dropdown tw-p-1"`, one dropdown each, Fomantic bound on all five, `aria-expanded="false"` on all five. The locators were never wrong.
- The added column is the fifth, and the board has to scroll to reach it: its trigger sits at x 1664 in a 1280 viewport, where the template columns need no scroll. That is the only difference between the column that fails and the ones that do not.
- The first click on that trigger is swallowed and the second one opens the menu. Isolated: an extra click before the delete passes, scrolling the column into view and waiting a second before the delete fails, and neither waiting three seconds nor navigating first changes anything.
- The count of drags that fell back to `dispatchDragEvents` does not predict it. Three consecutive runs failed, two with one fallback and one with two, and the Cucumber baseline that passes falls back on both of its drags.

So `ProjectColumnFragment.openMenu` clicked the trigger once and never confirmed the menu opened: `findElement` polls for visibility on Selenium and returns a lazy locator on Playwright, where it waits for nothing. Task 2.5 replaces it with clicking until the menu is open, which is what the Selenium wait already amounted to.

`PlaywrightInteractionStrategy` logs nothing when a locator never becomes visible, where the Selenium strategy logs `Locator never became visible` with the locator, the url and the reason. That asymmetry is what made this read as a bare click timeout two calls below its cause, and closing it is worth its own change.

- [x] 2.5 Open the column menu by clicking until it is open, in `ProjectColumnFragment.openMenu`; verify the demo case passes three times running, the whole `playwright-native` suite passes, and the Cucumber `@project-board` and `@demo-e2e` scenarios still pass

The demo case passed on three consecutive firefox runs, `playwright-native` passed 19 of 19 on firefox, and Cucumber passed 172 steps across `@project-board` and `@demo-e2e`.

## 3. Wrap up

- [x] 3.1 Run the spec on chrome, firefox and edge, alone and with `test:parallel`, and verify the run is green on each
- [x] 3.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
- [x] 3.3 Run the whole `playwright-native` suite and verify the fixture changes leave the existing specs passing
- [x] 3.4 Document the spec and the new fixture in the `playwright-native` README
- [x] 3.5 Remove the temporary push trigger from `ct.yml` before the branch merges

The whole suite passed 19 of 19 on chrome, firefox and edge, alone and under `test:parallel`. The case takes 33 seconds, well inside the 120 seconds the suite declares globally, so it needs no timeout of its own.

CT run 468 passed both jobs from a push on this branch, 16 minutes 31 seconds, which is what says the admin token the case seeds its users with is minted there and not only on this workstation.
