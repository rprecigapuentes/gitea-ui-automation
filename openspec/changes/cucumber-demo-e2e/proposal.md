## Why

The demo rubric issued for 15-Sep puts 45% of the score on the complexity of one end-to-end case, judged on API preconditions, interaction between features and what the report shows. The most complex scenario the suite has today moves one card between two columns of a project board: a single feature, four steps. The framework is not what limits it: two page-object methods are missing, and Cucumber cannot continue a scenario as a second user, which the Vitest service has done since it was written.

## What Changes

- A Cucumber scenario that chains team membership, issue creation with label, milestone and assignee, a project board holding cards from two repositories, two drags, a column deletion, closing and reopening an issue, and what the assigned user is allowed to see. Its assertions are Gitea's behaviour and live in the `.feature` file.
- `IssuePage` gains `reopen()`, completing the pair with the existing `close()`. Each direction resolves on the state the reloaded page renders, not on the click returning.
- `SidebarComboFragment` gains a report of whether it offers a given option, so a scenario can assert the assignee dropdown does not list a user who is not an organization member, and does list him after the membership step.
- The cookie-injection session switch in `services/gitea-selenium-vitest/src/utils/session.util.ts` becomes shared support the Cucumber service uses, so a scenario can continue as another provisioned user without the login form.
- The scenario's seed adds a second repository, its issue, and a milestone, through the API clients that already exist.

### Out of scope

- A repository-creation page object. The repositories come from the API seed; no new page is written.
- Filtering the issue list by assignee, and any new API client or endpoint.
- The drag fallback, Healenium, the pipeline, and the browser matrix.
- Gitea's own behaviour as spec requirements: it belongs to the `.feature` file, not to `openspec/specs/`.

## Capabilities

### New Capabilities

- `cucumber-session-switching`: what a scenario can assume when it continues as a different provisioned user part way through.

### Modified Capabilities

- `page-objects`: a component reports whether a lazily-rendered menu offers an option, and a two-way state action exposes both directions.

## Impact

`business-logic/selenium/ui/pages/issues/issue.page.ts`, its `sidebar-combo.fragment.ts`, the Cucumber service's `features/` and `support/`, and the session utility shared out of `services/gitea-selenium-vitest`. No new dependency, no API client, no pipeline file.
