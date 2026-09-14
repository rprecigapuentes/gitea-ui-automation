## Context

See proposal.md - Why. Three facts shape the approach.

The session switch exists once, inside a service: `services/gitea-selenium-vitest/src/utils/session.util.ts` clears the browser's cookies and installs the ones `AuthClient.loginViaApi` minted. Services are leaves in this repo, so the Cucumber service cannot import it.

The `@project-board` hook already seeds an organization, two repositories and one issue in each, and records their identifiers in scenario state. What the new scenario needs beyond that is a milestone and the second provisioned user, which `MilestoneClient` and `seeded-users.ts` already provide.

Gitea only offers a user as an assignee once that user can see the repository, so the membership step is not decoration: it is what makes the assignee dropdown change between two reads of the same locator.

## Goals / Non-Goals

**Goals:**

- One scenario whose steps each depend on the one before it, so that what it verifies is the interaction between features and not a list of independent checks.
- Both readings of the assignee dropdown, the negative and the positive, come from the same fragment method.
- The session switch lives where both services can reach it.

**Non-Goals:**

- Splitting the case into several scenarios that share seeded state. The rubric rewards one case, and shared state between scenarios is what the seeding contract exists to prevent.
- Rewriting the session switch. It is moved, not redesigned.

## Decisions

**The session utility moves to `core/selenium` and the Vitest service imports it from there.** It manipulates the driver's cookie store, which is the driver layer's job, and `AuthClient` already sits in `business-logic` minting the cookies it installs. The alternative, copying it into the Cucumber service's `support/`, leaves two copies of an authentication path to drift apart. Re-pointing the Vitest import is one line and no behaviour change.

**The scenario gets its own tag and its own `Before`, which calls the same seeding helper `@project-board` uses, plus a milestone.** Adding the milestone to the existing hook would grow the seed of five scenarios that do not use it. The alternative of carrying both tags would run both hooks and seed the organization twice.

**The label is created through the UI, not the API.** `LabelListPage.createScopedLabel` exists, a scoped label is a form worth showing, and the label-filter assertion later in the scenario then verifies something the scenario itself created.

**The second user reaches the assignee list through a team, not as a repository collaborator.** The team flow is already built end to end (`NewTeamFragment`, `SpecificTeamFragment.addMemberByUsername`), and the team's empty-members state gives the scenario its first negative assertion.

## Risks / Trade-offs

- **One long scenario stops at its first failure, hiding every step after it.** → The granular smoke scenarios already cover the same features independently; this case is additive, and it runs under its own tag so a failure does not block the tagged smoke run.
- **`IssuePage.assignProject` is unverified for an issue whose repository joined the project after the project was created.** → Verify by hand before writing the step; if it does not hold, the card is added from the board instead and the scenario keeps its shape.
- **Two drags mean two chances to hit the Firefox fallback**, which reloads the board to decide whether the drop reached the server. → Accepted: the fallback is already proven on one drag, and the extra reload is seconds, not a failure mode.
- **A switched session that silently does not take would leave the permission assertions answering for the owner.** → The spec requires the switch to fail its step by name rather than continue, and the first assertion after the switch is one the owner would fail.
