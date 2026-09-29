## Why

The demo rubric issued for 15-Sep puts 45% of the score on the complexity of one end-to-end case. The most complex board scenario the suite has moves one card between two columns: one feature, four steps. Nothing yet ties an issue's team, its assignee, its board card and its milestone together in one case.

## What Changes

- A Cucumber scenario chaining team membership, issue creation with label, milestone and assignee, a board holding cards from two repositories, two drags, a column deletion, close and reopen, and what the assigned user may see. Its assertions are Gitea behaviour and live in the `.feature` file.
- `IssuePage` gains `reopen()`, completing the pair with the existing `close()`. Each direction resolves on the state the reloaded page renders, not on the click returning.
- `SidebarComboFragment` gains a report of whether it offers a given option, so a scenario can assert the assignee dropdown does not list a user who is not an organization member, and does list him after the membership step.
- `OrgNavigationFragment.navigateToTab` resolves on the address the browser reaches, and clicks again when the tab bar swallowed the first click while it was still upgrading.
- Assigning an issue to a project waits for the sidebar to list it: the choice is saved by a request of its own after the menu closes.
- The seed adds a milestone through the existing API client, and provisioned users carry the id the assignee menu addresses them by.

### Out of scope

- A repository-creation page object. The repositories come from the API seed.
- A second way to act as another user: the suite already switches users through the login form, and this scenario reuses those steps.
- Filtering the issue list by assignee, and any new API client or endpoint.
- The drag fallback, Healenium, the pipeline, and the browser matrix.
- Gitea's own behaviour as spec requirements: it belongs to the `.feature` file, not to `openspec/specs/`.

## Capabilities

### Modified Capabilities

- `page-objects`: menu-option reporting, two-way state actions, tab navigation that resolves on its address, and confirmation of a choice the page saves on its own.
- `cucumber-seeded-users`: a provisioned user carries the identifier the interface never displays, alongside its credentials.

## Impact

`business-logic/selenium/ui/pages/issues/*`, `organizations/fragments/org-navigation.fragment.ts`, the scenario state entity, and the Cucumber service's `features/`. No new dependency, no API client, no pipeline file.
