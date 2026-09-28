# Proposal

## Why

`demo-e2e.feature` is the heaviest case the framework carries: one scenario of sixty-one steps that
walks a work item from the team allowed to be assigned it, through the board that tracks it, to the
member who can no longer administer it. It exists as Gherkin in the Cucumber service and as
`demo-e2e.spec.ts` in `playwright-native`. `playwright-bdd` is the runner without it.

It is also the case the comparison most needs. `login` is shared but trivial and `project-board` is
five short scenarios; neither says much about how the three runners behave when a scenario is long,
switches sessions, and chains eight values across its steps.

## What Changes

- `services/playwright-bdd` gains `demo-e2e.feature`, copied byte for byte from the Cucumber
  service, and the step definitions its steps resolve to, written by the Playwright generator.
- Twenty-one of its fifty-four distinct steps are already defined here by `project-board.steps.ts`
  and `create-issue.steps.ts` and SHALL NOT be written again: two definitions matching one step make
  the run ambiguous. Thirty-three are new.
- A starting state for the scenario, declaring the seeded organization, its milestone and the two
  seeded users, so the generator explores the world the scenario runs in.

Out of scope: `organizations.feature`, which is the remaining migration; deleting anything from
`playwright-native`, since the suites carry the same cases on purpose; the tag-scoped hooks, which no
scenario has yet asked for; and page objects, which `playwright-native` already proves are complete
for this case.

## Capabilities

No requirement changes. The `playwright-bdd` capability already requires that a feature shared with
the Cucumber service carries identical text and that each of its steps resolves to exactly one
definition; this change is a second feature under rules that already exist, on a fixture layer this
service already has. `.openspec.yaml` records `skip_specs: true`.

## Impact

- `services/playwright-bdd/features/`: one feature and one step-definition file, both new.
- `services/playwright-bdd/tests/seeds/`: one starting state added.

No fixture change: the organization, project-board and issue groups are already in this service's
chain. No page object, no client, no workflow.
