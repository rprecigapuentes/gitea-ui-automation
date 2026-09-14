## 1. Page-object methods

- [ ] 1.1 Add `reopen()` to `business-logic/selenium/ui/pages/issues/issue.page.ts`, resolving on the status button having flipped back from reopen, the way `close()` resolves on the opposite condition; verify by driving close then reopen against a seeded issue and reading `getState()` as "Open"
- [ ] 1.2 Add an option-presence report to `business-logic/selenium/ui/pages/issues/fragments/sidebar-combo.fragment.ts` that opens the menu, checks the option instantly and does not toggle an already-open menu; verify it reports false for a user who is not an organization member and true for one who is, without waiting out a timeout on the negative

## 2. Session switching

- [ ] 2.1 Move `services/gitea-selenium-vitest/src/utils/session.util.ts` into `core/selenium` and re-point the Vitest service's import; verify `npm run typecheck` passes and the Vitest login test still authenticates
- [ ] 2.2 Add a step-facing helper in the Cucumber service's `features/support/` that takes a provisioned user, clears the current session and installs that user's, failing by name when the session cannot be obtained; verify with a throwaway scenario that logs in as the owner, switches to the second provisioned user, and reads that user's name from the navbar

## 3. Seeding

- [ ] 3.1 Give the new scenario its own tag and `Before` in `features/support/hooks.ts`, reusing the helper that seeds the organization, two repositories and an issue in each, and adding a milestone on the first repository; verify the tagged run finds the milestone and both issues in scenario state before its first step

## 4. The scenario

- [ ] 4.1 Write the feature file's first phase: login as owner, create the team, assert the empty-members state, add the second user, assert the member counters; verify the tagged run passes these steps on chrome
- [ ] 4.2 Add the assignee phase: assert the dropdown does not offer the second user before the membership step and does after it, using the fragment method from 1.2; verify both assertions run against the same locator and the negative one resolves quickly
- [ ] 4.3 Add the issue phase: create the scoped label through the UI, create two issues with description preview, label, milestone and assignee, and assert the label filter returns only the labelled one; verify the tagged run passes and the filtered list excludes the second issue
- [ ] 4.4 Add the board phase: create the Basic Kanban project, add a column, add all three issues to it, assert the column counts, drag two cards, then delete the added column and assert its card fell back to the default column; verify the tagged run passes on chrome and firefox, firefox exercising the drag fallback
- [ ] 4.5 Add the state phase: close the issue, assert the board leaves its card where it was, assert the milestone now counts one closed issue at 50%, then reopen and assert both readings return; verify the tagged run passes and the milestone percentages are read from the milestone list page
- [ ] 4.6 Add the permission phase: switch to the assigned user, assert he sees the issue assigned to him and does not see the owner-only controls on the organization, the team and the board; verify the tagged run passes and each negative assertion is one the owner would fail

## 5. Verification

- [ ] 5.1 Run the tagged scenario across the three browsers in parallel and confirm the Allure report shows it passing on each, with its steps readable as the phases above
- [ ] 5.2 Time the same flow by hand once and record the manual duration beside the automated one, for the execution-time comparison the demo needs
- [ ] 5.3 Run `npm run format`, `npm run lint` and `npm run typecheck`
