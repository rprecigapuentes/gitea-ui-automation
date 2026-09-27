# Proposal

## Why

Four suites run here on purpose, so that the frameworks can be compared on the same cases. The board
case is already written three times — as Gherkin in the Selenium Cucumber service, and as
`project-board.spec.ts` plus `project-board-drag-and-drop.spec.ts` in `playwright-native`, five
scenarios with the same titles on both sides. `playwright-bdd` is the runner that does not have it.

Migrating it puts the same five cases in three runners, two of which read the _same_ Gherkin. That
is the comparison the four suites exist to make, and no case has offered it yet: `login` is shared
but trivial, and `create-issue` was authored for this service alone.

## What Changes

- `services/playwright-bdd` gains `project-board.feature`, copied byte for byte from the Cucumber
  service, and the step definitions its five scenarios resolve to, written by the Playwright
  generator.
- Its fixture module gains the organization and project-board groups. `projectBoardFixtures` already
  documents itself as this feature's `Background`, and seeds and removes what the scenarios need.
- A starting state for the board, so the generator explores inside the seeded organization rather
  than inventing one.

Out of scope: deleting anything from `playwright-native`, since the suites are meant to carry the
same cases; `demo-e2e.feature` and `organizations.feature`, which come one at a time; tag-scoped
hooks and where they would live, which the first scenario that creates an organization through the
browser will decide; a pre-run sweep of orphaned organizations; and page objects, none of which this
needs.

## Capabilities

### Modified Capabilities

- `playwright-bdd`: the requirement that the _login_ feature is shared with the Cucumber service
  generalises to any feature shared with it, and the service carries more than one such feature.

## Impact

- `services/playwright-bdd/features/`: one feature and one step-definition file, both new.
- `services/playwright-bdd/fixtures/fixture.ts`: two fixture groups added to the chain.
- `services/playwright-bdd/tests/seeds/`: one starting state added, and its fixture module widened.

No page object, no client, no workflow and no change to any other service. The Cucumber feature is
read and never edited: its text is the specification both services share.
