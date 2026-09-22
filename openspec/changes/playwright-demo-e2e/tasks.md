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

2.2 is the phase the first attempt at this port failed on, so it is split from the rest rather than written in one pass. It is written and failing, at `deleteColumn`, where the click waits on a delete item that is in the DOM and has no box.

What the probes measured, on firefox, against the board the scenario leaves behind:

- The column's dropdown is not open and does not open. Its trigger keeps `class="ui dropdown tw-p-1"` and its `.menu` stays `display: none`, where Fomantic marks an open dropdown `active visible` and its menu `visible transition`. The delete item under it reads `display: block` and `visibility: visible` but `getClientRects().length === 0`, which is why Playwright waits on it instead of failing: the item is only hidden by its closed ancestor.
- It is the added column specifically. In the same run, at the same moment, one click on a template column's trigger opens that column's menu and one click on the added column's trigger does not.
- Waiting does not fix it: three seconds before the delete fails the same way. Navigating does not fix it either: `openFor` before the delete fails the same way.
- The count of drags that fell back to `dispatchDragEvents` does not predict it. Three consecutive runs failed, two of them with one fallback and one with two, and the Cucumber baseline that passes falls back on both of its drags.
- One reproduction does open it: a `reload` followed by a direct click on the trigger, through the strategy rather than through `ProjectColumnFragment.openMenu`. That path differs from the failing one only in the guard `openMenu` reads first, so that guard is the next thing to measure.

What the Cucumber baseline measures, firefox, `@demo-e2e`, 62 steps passed: the same page object deletes the same column after the same two drags without trouble, so nothing here is a page-object defect on its own.

`PlaywrightInteractionStrategy` logs nothing when a locator never becomes visible, where the Selenium strategy logs `Locator never became visible` with the locator, the url and the reason. That asymmetry is what made this failure read as a bare click timeout, and closing it is a candidate task once the cause is known.

Any point where `PlaywrightInteractionStrategy` or a page object turns out to disagree with what the Selenium steps assume gets its own task here, with the failure that found it, as the four ports before this one did.

## 3. Wrap up

- [ ] 3.1 Run the spec on chrome, firefox and edge, alone and with `test:parallel`, and verify the run is green on each
- [ ] 3.2 Verify `npm run format`, `npm run lint` and `npm run typecheck` are green
- [ ] 3.3 Run the whole `playwright-native` suite and verify the fixture changes leave the existing specs passing
- [ ] 3.4 Document the spec and the new fixture in the `playwright-native` README
