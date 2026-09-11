## Context

See proposal.md - Why. Current implementation (`core/selenium/ui/base-pages/base-component.ts`, `base.page.ts`): `getReadyLocators()` is an overridable protected method; `isVisible()` defaults to checking it, and is itself declared `isVisible(...args: unknown[])` specifically so seven page/fragment classes can override it with their own signature (`isVisible(isOwner: boolean)`, `isVisible(username, pageContext)`, etc.) and branch internally. `exists()` and `doesNotExist()` are separate methods with logic that already duplicates the per-locator check `isVisible()` does for its declared ready locators. `BasePage.open()` reads `getReadyLocators()` to decide what to wait for after navigating.

This design was worked out interactively and prototyped as `.alt.ts` files sitting next to the real ones (now superseded by this change's tasks, to be deleted once the real files are updated): `core/selenium/ui/base-pages/{base-component,base.page}.alt.ts` and seven matching files under `business-logic/selenium/ui/pages/`. Decisions below reflect what that prototyping surfaced, including two bugs found and fixed along the way.

## Goals / Non-Goals

**Goals:**

- One method (`isVisible`) answers "does this locator/these locators resolve", taking the locators explicitly.
- No method is overridden with a component-specific signature; a component with several shapes of "visible" gets several plainly-named methods instead.
- `open()`'s post-navigation wait is an explicit argument, not sourced from an overridable property.

**Non-Goals:**

- Changing what any test asserts about Gitea.
- A registry/factory for a component's visibility variants (see proposal.md - Out of scope).
- Touching `click`/`type`/`getText`/`getAttribute`/`actAndWaitFor`/`clickAndWaitFor`/`typeAndWaitFor`.

## Decisions

**`isVisible(locators: By | By[], root?, timeoutMs?)` replaces `exists()`/`doesNotExist()`/the parameterless `getReadyLocators()`-driven check.**
Accepting `By | By[]` (rather than only an array) keeps the common single-locator call site (`this.isVisible(oneLocator)`) as terse as the old `exists()`. Considered keeping `exists` as a separate name and only removing `getReadyLocators`; rejected because `exists` and a per-locator `isVisible` would still be the same check under two names, which is the redundancy being removed.

**Dropping `getReadyLocators()` means nothing overrides `isVisible` anymore, which removes a subtler bug class.** With the current code, any class overriding `isVisible(isOwner)` shadows the base method: calling `this.isVisible(oneLocator)` from inside such a class either fails to typecheck or, where the override happens to take no arguments (`MainPage`, `CreateOrganizationPage`), recurses infinitely. The current code avoids this by calling `super.isVisible(...)` for per-locator checks - a workaround that is easy to get wrong and non-obvious to a new contributor. Removing overrides removes the workaround's reason to exist: every method can call `this.isVisible(...)` directly.

**A component with multiple visibility shapes gets multiple named methods, not one method with a branch.** E.g. `OrgTeamsFragment.isVisibleForOwner()`/`isVisibleForMember()` instead of `isVisible(isOwner: boolean)`. This was the specific complaint driving the change: the decision of which locators matter belongs with the method answering for a specific shape, not as an `if` inside a single method trying to answer for all shapes. Considered a strategy/factory pattern selecting between shapes; rejected for now as more machinery than four call sites justify (recorded as out of scope, revisit if the number of shapes per component grows).

**`timeoutMs: 0` on `isVisible`/`findElements` means "check once, right now", not "no timeout".** Bug found while prototyping: `selenium-webdriver`'s `driver.wait(condition, timeout)` treats a falsy `timeout` as unbounded (it polls forever), the opposite of what an instant absence check needs. `findElements` special-cases `timeoutMs === 0` to run its check function exactly once and throw immediately if unsatisfied, bypassing `driver.wait` entirely for that case. This is what `!(await this.isVisible(locator, root, 0))` (the `doesNotExist()` replacement) relies on.

**`findElements` collapses presence and visibility into one wait instead of two sequential phases**, and drops the diagnostic dump (url/title/page text/matched-elements HTML) it logged on failure. Selenium's own `TimeoutError`, given a short message naming the locator, already identifies what failed; the two-phase wait and the extra logging were the bulk of the method's length without changing what a caller could observe.

**`BasePage.open()` takes `readyLocators: By[] = []` as a parameter.** A page needing a post-navigation wait overrides `open()` once to supply its own list (see `MainPage.open()` in the prototype), rather than the base wiring it implicitly from a declared property. Trade-off: `open()`'s wait and `isVisible()`'s check are now two independent call sites that happen to reference the same locators by convention, not by construction - see Risks below.

## Risks / Trade-offs

- **[Risk]** `open()`'s wait list and a page's own visibility check can drift apart since nothing forces them to share a declaration anymore. → **Mitigation**: keep the convention visible in code review - a page that overrides `open()` should reference the same locator constants its visibility method(s) use, as the prototype does.
- **[Risk]** This is a breaking change to a public API (`isVisible`, `exists`, `doesNotExist`, `open`) with real call sites in both test suites. → **Mitigation**: tasks below update every call site in the same change; `tsc --noEmit` across both service workspaces is the gate that catches anything missed.
- **[Risk]** Losing the "exactly one element" ambiguity guard was considered (dropping `findElement` entirely in favor of always returning arrays) but rejected - silently acting on the wrong one of two matching elements is a worse failure mode than the few extra lines `findElement` costs. Kept as-is.

## Migration Plan

Implemented directly on this branch (`rene/implement-organizations-refactor`), no separate rollout - see tasks.md for the ordered steps. Rollback is a plain `git revert` of the change's commits; there is no data or environment migration involved (build-time TypeScript API only).
