## Why

`services/gitea-selenium-vitest`'s `organizationPages` fixture already exposes `OrganizationFacade` and its fragments, resolving the `Organization` they need lazily from `scenarioState` at the moment a caller actually asks for the facade. Cucumber's `PageFactory` has no equivalent: it is a plain class built once in `Before`, before any organization exists (the organization is created later, mid-scenario, through UI steps), and it currently exposes none of the organization-scoped fragments or the facade at all.

## What Changes

- `PageFactory` gains a second constructor argument, the scenario's `ScenarioState`, and a private `requireOrganization()` that reads `scenarioState.organization` lazily (mirroring the Vitest fixture's own closure) and throws if it isn't set yet. `hooks.ts`'s `Before` hook passes the same `scenarioState` object it assigns to `this.scenarioState`.
- `PageFactory` gains lazy getters for the five organization fragments (`orgNavigation`, `orgRepositories`, `orgTeams`, `orgNewTeam`, `orgSpecificTeam`) and for `orgFacade`, which constructs `OrganizationFacade` through `requireOrganization()` the first time it's read — flat getters, matching `PageFactory`'s existing style (no nested sub-object).
- `OrganizationFacade` starts extending `BasePage` instead of hand-implementing `Navigable`, gaining `isVisible` through `BaseComponent` rather than reaching the driver directly. It gets its own `locators` (one entry: the organization profile page's main region) and a minimal `waitForElements()` that waits for that single locator. Its now-redundant `open()` override is dropped — `BasePage`'s inherited implementation is behaviorally identical, and nothing calls it today.
- `organizations.steps.ts` gains a step that clicks the existing `NavBarFragment.clickViewOrganizationButton()` and then calls the facade's new `waitForElements()`; `organizations.feature`'s `@e2e` scenario gets this as its next step, replacing the commented-out placeholder.

### Out of scope

- Fleshing out `waitForElements()` beyond the one locator, or any further step of the `@e2e` scenario (team creation, etc.) — this change only proves the navigation + wait works.
- Any change to `services/gitea-selenium-vitest`'s `fixture.ts` or `organizations.test.ts` — the facade's constructor signature (parameter order and types) is unchanged, so its existing `new OrganizationFacade(driver, org, navigation, ...)` call keeps working as-is.
- A generic tag/fixture-injection framework for Cucumber. Two constructor args and six getters are enough at this scale.

## Capabilities

### Modified Capabilities

- `page-objects`: adds the requirement that an organization-scoped page object, fragment, or facade resolves the organization it targets lazily, at first use, rather than at construction time.

## Impact

`business-logic/selenium/ui/pages/organizations/facade/organization.facade.ts`; `services/gitea-selenium-cucumber/features/support/page.factory.ts`, `hooks.ts`, `features/step-definitions/organizations.steps.ts`, `features/scenarios/organizations.feature`. No dependency changes; `services/gitea-selenium-vitest` is read for reference only, not modified.
