## 1. Compose the state the scenario starts from

- [x] 1.1 Give `SeededUser` the `id` `UserClient.createUser` already returns, in `fixtures/organizations-fixtures.ts`; verify the organization specs that read the fixture are unaffected
- [x] 1.2 Chain `fixtures/project-board-fixtures.ts` onto `fixtures/organizations-fixtures.ts`; verify the two board specs pass unchanged, which is what says the added fixtures never run for a test that does not ask for them
- [x] 1.3 Add `seededMilestone` to `fixtures/project-board-fixtures.ts`, on the seeded organization's first repository, due in seven days as the Cucumber hook sets it; verify the board specs are unaffected
- [x] 1.4 Record the organization in `scenarioState` from `seededOrganizationWithRepositories`, and clear it before deleting

`PageFactory` throws `organization is not set in scenarioState` when it is missing, so the facade cannot be opened without 1.4. Clearing it in the fixture's own teardown is what keeps `cleanupCreatedOrganization`, which tears down after it, from deleting an organization that is already gone.

## 2. Port the scenario

- [x] 2.1 Write `tests/demo-e2e.spec.ts` through the phase that adds a column to the board, through `pageObjects` only, and verify it passes on firefox with no assertion dropped against `demo-e2e.feature`
- [ ] 2.2 Add the phases that drag the cards and delete the column they were dragged into, and verify they pass
- [ ] 2.3 Add the phases that close and reopen the issue and read the milestone, and verify they pass
- [ ] 2.4 Add the phase that signs in as the member, and verify it passes

2.2 is the phase the first attempt at this port failed on, so it is split from the rest rather than written in one pass. What the Cucumber baseline measures, on firefox, `@demo-e2e`, 62 steps passed: the drag falls back to `dispatchDragEvents` on both cards there too, and the column delete that follows still opens its menu. So the synthetic drag is not what breaks, and the failure is specific to the Playwright path.

Any point where `PlaywrightInteractionStrategy` or a page object turns out to disagree with what the Selenium steps assume gets its own task here, with the failure that found it, as the four ports before this one did.

## 3. Wrap up

- [ ] 3.1 Run the spec on chrome, firefox and edge, alone and with `test:parallel`, and verify the run is green on each
- [ ] 3.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
- [ ] 3.3 Run the whole `playwright-native` suite and verify the fixture changes leave the existing specs passing
- [ ] 3.4 Document the spec and the new fixture in the `playwright-native` README
