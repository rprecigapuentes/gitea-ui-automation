## Context

Four of the five smokes need only steps the `@e2e` scenario already defined, plus one new step,
`an organization already exists`, built on the `existingOrganization` fixture already chained in.
The fifth, "Add a repository to a team", is tagged `@team-repository` in Cucumber and relies on a
`Before` hook scoped to that tag to seed an organization, a team and a repository before its first
step — nothing in its own Gherkin text creates them.

## Decisions

### The `@team-repository` precondition is a tag-scoped `Before` hook, not a fixture the step declares

`migrate-project-board-to-bdd` (unmerged, board feature) chose fixtures over tag-scoped hooks
because there every scenario in that feature needed the same `Background`. Here only one of six
scenarios sharing this feature's steps needs `seededOrganizationWithTeamAndRepository`. "The seeded
organization is open" is one step definition matched by text across scenarios; making it declare
that fixture would resolve it — and seed an organization nobody asked for — for every scenario that
calls that step, including `@e2e`, which already made its own.

`createBdd` exposes `Before`/`After` scoped by tag, mirroring Cucumber's own mechanism for exactly
this case. `Before({ tags: TEAM_REPOSITORY_TAG }, ...)` runs once, only for a scenario carrying that
tag, before its first step, and sets `scenarioState.organization` from the fixture's result — so
"the seeded organization is open" finds it already there and stays exactly as `@e2e` uses it.

Alternative considered: split "the seeded organization is open" into two step texts. Rejected —
the Gherkin text is Cucumber's, and splitting it would no longer be identical to the source.
