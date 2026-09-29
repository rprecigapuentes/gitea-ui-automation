## Context

See proposal.md - Why. Three facts shape the approach.

The Cucumber suite already switches users: `I logout` and `I login with valid credentials as user {int}` run the login form against the accounts the run provisions, and the organization end-to-end case uses them eight times. Nothing else is needed to verify what a second user sees.

The `@project-board` hook already seeds an organization, two repositories and one issue in each, and records their identifiers in scenario state. What the new scenario needs beyond that is a milestone, which `MilestoneClient` already creates.

Gitea only offers a user as an assignee once that user can see the repository, so the membership step is not decoration: it is what makes the assignee dropdown change between two reads of the same locator.

## Goals / Non-Goals

**Goals:**

- One scenario whose steps each depend on the one before it, so that what it verifies is the interaction between features and not a list of independent checks.
- Both readings of the assignee dropdown, the negative and the positive, come from the same fragment method.
- Every step that already exists is reused rather than reworded.

**Non-Goals:**

- Splitting the case into several scenarios that share seeded state. The rubric rewards one case, and shared state between scenarios is what the seeding contract exists to prevent.
- A second mechanism for acting as another user. The cookie-injection switch in the Vitest service stays where it is.

## Decisions

**The scenario gets its own tag and its own `Before`, which calls the same seeding helper `@project-board` uses, plus a milestone.** Adding the milestone to the existing hook would grow the seed of five scenarios that do not use it. Carrying both tags would run both hooks and seed the organization twice.

**The label is created through the UI, not the API.** `LabelListPage.createScopedLabel` exists, a scoped label is a form worth showing, and the label filter later in the scenario then verifies something the scenario itself created.

**The second user reaches the assignee list through a team, not as a repository collaborator.** The team flow is already built end to end, and the team's empty-members state gives the scenario its first negative assertion.

**The created issue is followed by its number, and the board by the seeded issues' ids.** The internal id a card is addressed by is never displayed, so the issue created through the form is verified on the board by column counts, and the cards named in assertions are the seeded ones whose ids the API returned.

**Two shared waits were added rather than worked around in the steps.** The organization tab click and the project assignment both reported success before the browser had gone anywhere, which is what made the first runs fail; fixing them in the page objects keeps every scenario honest instead of padding this one with re-opens.

## Risks / Trade-offs

- **One long scenario stops at its first failure, hiding every step after it.** → The granular smoke scenarios already cover the same features independently; this case is additive and runs under its own tag.
- **Two drags mean two chances to hit the Firefox fallback**, which reloads the board to decide whether the drop reached the server. → Measured: both drags fall back on Firefox and the run still finishes in 23.6s.
- **The demo scenario shares the instance with the organization end-to-end case, which fails on `I add the following repositories to each team:` before this change and after it.** → Out of scope here, but it is the first thing a full-suite demo run will show.
