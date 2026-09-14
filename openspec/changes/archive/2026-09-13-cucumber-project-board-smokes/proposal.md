## Why

The Cucumber service has one feature (login) and no way to put data in place: its hooks only start and quit the driver. The four project-board smokes need an organization, two repositories and an issue in each before the browser opens, and today only the Vitest service's fixtures know how to do that.

## What Changes

- Tagged hooks seed an organization, two repositories and one issue per repository through the API before a tagged scenario runs, and delete the organization after it, whether it passed or failed.
- `OrganizationClient` gains organization creation and `RepositoryClient` gains organization-owned repository creation. Today only their delete and user-owned halves exist.
- A seeded issue records its internal id alongside its number, because a board card is identified by that internal id and not by the number the UI shows.
- The Cucumber service gains an owner-token resolver, mirroring the Vitest one.
- New page objects for organization-level projects: the creation form, the project list, the board, and a column fragment built with a root, the way `SidebarComboFragment` is.
- A `project-board.feature` carrying S2-SMK-ISS-01 to 04, with its steps. The project itself is created by an explicit `Given` through the UI, because Gitea 1.27.3 exposes no projects API.

### Out of scope

- S2-SMK-ISS-05, the drag and drop. SortableJS does not answer reliably to Selenium's `dragAndDrop`, and pinning that down is its own change.
- S2-SMK-ISS-06 to 09 and the end-to-end cases. 07 alone would pull a second authenticated session into this service.
- Porting the seeding hooks to the Vitest service. The only line this change touches there records the issue id the shared entity now carries.
- The `page-objects` logging requirement the merged visibility refactor left contradicting the code. Separate change.
- The board behaviour itself, which belongs to the `.feature`.

## Capabilities

### New Capabilities

- `scenario-seeding`: how a scenario declares the state it needs, how the framework puts it in place before the browser opens, where it lives while the scenario runs, and when it is removed.

### Modified Capabilities

None. The `page-objects` contract from the visibility refactor already covers what the new page objects need. They comply with it; they do not change it.

## Impact

`business-logic/selenium/api/clients/organizations.client.ts` and `repository.client.ts`, `api/entities/issue.entity.ts`, `state/scenario.entity.ts`, a new `ui/pages/projects/` directory, one line of `services/gitea-selenium-vitest/src/fixtures/fixture.ts`, and, in `services/gitea-selenium-cucumber/`, `features/support/{hooks,credentials,world,page.factory}.ts` plus the new feature and steps. No driver, dependency or pipeline change.
