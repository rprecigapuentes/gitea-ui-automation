## 1. Page-object methods

- [x] 1.1 Add `reopen()` to `issue.page.ts` and put both directions of the status button on the rendered state rather than on the click; verified by the scenario closing and reopening the created issue and reading `getState()` as "Closed" then "Open"
- [x] 1.2 Add the option-presence report to `sidebar-combo.fragment.ts`, opening the menu first and checking the option instantly; verified by the scenario reporting false for a non-member and true for the same user after the membership step
- [x] 1.3 Make `navigateToTab` resolve on the address it reaches and click again when the tab bar swallowed the click; verified by the organization steps reaching the teams tab from the organization profile
- [x] 1.4 Make `assignProject` wait for the sidebar to list the project; verified by the board counting three cards on the run that previously counted two

## 2. Seeding and state

- [x] 2.1 Record the id of each provisioned user in `seeded-users.ts`; verified by the assignee assertions addressing users by id
- [x] 2.2 Give the scenario its own tag and `Before` in `hooks.ts`, reusing the organization-with-issues seed and adding a milestone; verified by the tagged run finding both issues and the milestone before its first step
- [x] 2.3 Add the scenario-state accessors and the created label, milestone and issue to `ScenarioState`; verified by typecheck and by the steps reading them

## 3. The scenario

- [x] 3.1 Register the issue form, issue list, label list and milestone list pages in the page factory
- [x] 3.2 Write `demo-e2e.feature` and the steps it needs, reusing the login, organization, team and board steps that already exist; verified by the tagged run passing all 61 steps

## 4. Verification

- [x] 4.1 Run the tagged scenario on chrome three times: 61 steps passed each time, ~21s
- [x] 4.2 Run it on firefox (23.6s, both drags fell back to the dispatched events) and on edge (26.2s)
- [x] 4.3 Run `npm run format`, `npm run lint` and `npm run typecheck`
- [ ] 4.4 Time the same flow by hand once and record the manual duration beside the automated one, for the execution-time comparison the demo needs

4.4 is archived open. It is a stopwatch measurement of a person driving the flow by hand, which no
run of this repository can produce, and the demo it was for has passed. The automated figures it was
to sit beside are in 4.1 and 4.2 and stand on their own.
