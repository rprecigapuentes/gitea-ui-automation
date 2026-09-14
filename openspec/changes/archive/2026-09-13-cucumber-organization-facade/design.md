## Context

`services/gitea-selenium-vitest/src/fixtures/fixture.ts`'s `organizationPages` fixture already solves this exact problem for Vitest: it builds the five org fragments eagerly (they need nothing but `driver`), but defers building `OrganizationFacade` — and reading `scenarioState.organization` — until `orgFacade()` is actually called, via a `requireOrganization()` closure that throws if the organization isn't set yet. Cucumber's `PageFactory` (`services/gitea-selenium-cucumber/features/support/page.factory.ts`) is a plain class, constructed once in `hooks.ts`'s `Before`, with no visibility into `scenarioState` at all and no organization-scoped members.

`OrganizationFacade` itself (`business-logic/selenium/ui/pages/organizations/facade/organization.facade.ts`) implements `Navigable` by hand (`getUrl`/`open`) and calls `this.driver.get()` directly in `open()` — the one place in this file that reaches the browser outside `BaseComponent`, which the project's own convention (`597f859`) treats as a review blocker. It has no `locators` and no `isVisible` access today.

## Goals / Non-Goals

**Goals:**

- `PageFactory` exposes `OrganizationFacade` and its five fragments, the same way `organizationPages` does for Vitest.
- The facade and organization-scoped fragments learn about the organization the same way Vitest's do: lazily, at first use, not at construction time — since `PageFactory` is built before the organization exists.
- `OrganizationFacade`'s public constructor signature (parameter order and types) is unchanged, so Vitest's `fixture.ts` keeps compiling and behaving exactly as it does today.
- The first slice proves the design end-to-end: click `viewOrganization`, then a minimal one-locator `waitForElements()` on the facade.

**Non-Goals:**

- A richer `waitForElements()`, or any step of the `@e2e` scenario beyond this one — deliberately deferred so the design gets verified before it's built on.
- A general tag-to-fixture injection framework for Cucumber. Two constructor args and six getters is the whole surface needed here.
- Changing anything in `services/gitea-selenium-vitest`.

## Decisions

**`PageFactory` takes `scenarioState: ScenarioState` as a second constructor argument, read lazily inside each organization-scoped getter.** `hooks.ts` already creates `scenarioState` before constructing `PageFactory` and holds onto that same object (`this.scenarioState = scenarioState`); passing it into `PageFactory` too means both hold a reference to the same mutable object, so when a later step does `this.scenarioState.organization = organization`, `PageFactory`'s own reference sees it immediately — no re-construction, no setter needed. This is the direct Cucumber analogue of the Vitest fixture's closure over `scenarioState` from its own fixture arguments. Alternative considered: have `hooks.ts` or a step definition construct `OrganizationFacade` ad hoc once the org exists, keeping `PageFactory` untouched. Rejected — the user asked for the facade to live in `PageFactory` "junto con sus fragmentos", and ad hoc construction would mean re-deriving fragment instances (or threading them through World) wherever the facade is needed.

**A private `requireOrganization()` method, same shape as the Vitest fixture's, throws when the organization isn't set.** Keeps the failure mode identical across both services: using the facade too early is a bug, and it should fail loudly rather than construct a facade pointed at `undefined`.

**`PageFactory`'s new getters stay flat (`orgNavigation`, `orgRepositories`, `orgTeams`, `orgNewTeam`, `orgSpecificTeam`, `orgFacade`) rather than nested under a sub-object.** `organizationPages` in Vitest nests because that's how a single fixture value is shaped; `PageFactory` has never nested anything (`loginPage`, `navBar`, `createOrganizationPage` are all top-level getters), so a nested `organizationPages` getter here would be the only nested member and inconsistent with the rest of the class.

**`OrganizationFacade` starts extending `BasePage`.** It needs `isVisible` for `waitForElements()`, and `BasePage` already provides exactly the `getUrl`/`open` shape the facade hand-rolls today. Its `open()` override is dropped: `BasePage`'s inherited `open(readyLocators = [])` calls `this.driver.get(this.getUrl())` when given no locators — identical to the facade's own override — and nothing calls `.open()` on the facade anywhere in the codebase today (confirmed by search), so removing it is behavior-preserving. This also fixes the facade's one direct `this.driver.get()` call, brought into line with the BaseComponent-only-reaches-the-browser convention as a side effect of the extends change, not a separate cleanup pass.

**The facade's one locator is the organization profile's main region** (`[role='main'].organization.profile`), the same selector `OrgNavigationFragment` already uses for `isVisibleForOwner`/`isVisibleForMember`. It's the element that's present as soon as any view of the organization (repos tab, the facade's default landing view) has loaded, making it the right single thing to wait for at this "super basic" stage. `waitForElements()` takes no arguments (the organization is already known via the constructor), unlike `OrganizationDashboardPage.waitForElements(organization)`, since the facade already has the organization from construction.

## Risks / Trade-offs

- **[Risk]** Extending `BasePage` changes `OrganizationFacade`'s prototype chain. → **Mitigation**: its public constructor signature and every existing method (`getUrl`, `navigateToRepositoriesTab`, `navigateToTeamsTab`, `navigateToNewTeam`, `createTeam`, `navigateToSpecificTeam`) keep their exact signatures; `services/gitea-selenium-vitest`'s usage (`orgFacade().getUrl()`, `.navigateToTeamsTab()`, etc.) only ever calls through the public API, verified with `npm run typecheck -w gitea-selenium-vitest` after the change.
- **[Risk]** `requireOrganization()` throwing if a getter is read too early is a new failure mode inside `PageFactory`. → **Mitigation**: matches Vitest's existing behavior exactly (same message shape), and the only caller added in this change (the new step definition) reads it after `scenarioState.organization` is already set by an earlier step.

## Migration Plan

Implemented directly on `rene/83-add-org-e2e-test`, task by task — see tasks.md. Each task is reviewed and committed by the user individually; this change is not committed by the agent. Rollback is `git revert` per commit; no data or environment migration involved.
