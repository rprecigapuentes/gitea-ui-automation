## Context

See proposal.md - Why. Two constraints shape the approach.

The eight implementers do not share a signature. Five take a parameter (`isOwner: boolean`, `username: string`, `pageContext: "main" | "organization"`), three take none. TypeScript rejects an override that adds a required parameter, because a function of more required parameters is not assignable to one of fewer.

Six of the eight are fragments extending `BaseComponent`, not pages extending `BasePage`. Only `MainPage` and `CreateOrganizationPage` are pages. Any mechanism placed on `BasePage` reaches a quarter of the problem.

## Goals / Non-Goals

**Goals:**

- One inherited default so a new page object or fragment answers the predicate without writing one.
- `base-component.ts` smaller after the change than its current 199 lines.
- Each commit leaves both suites green on its own.

**Non-Goals:**

- Reducing the number of assertions any component makes. The change moves and renames them; it does not decide what a component ought to verify.
- Making `open()` wait on more than it waits on today.

## Decisions

### `Verifiable` with a rest parameter, mirroring `Navigable`

`base.page.ts` already solves the variable-signature problem: `Navigable` declares `getUrl(...args: unknown[])` and `open(...args: unknown[])`, and the concrete pages narrow it. `Verifiable` follows that precedent with `isVisible(...args: unknown[]): Promise<boolean>`.

Alternatives considered. Making every parameter optional weakens the concrete signatures for no gain. Forcing a uniform no-argument `isVisible()` and moving the parameterised checks to separate methods is a larger change that reintroduces the second name this change exists to remove. Leaving the predicate off the base entirely and relying on convention is what the repository does today, and is what let the name drift.

### `getReadyLocators()` moves down to `BaseComponent`

It lives on `BasePage` today, where the six fragments cannot reach it. Moving it down is a smaller change than duplicating the concept on a fragment base, and `BasePage.open()` keeps consuming it unchanged.

### Ready elements are the anchor, not the full assertion

`MainPage` already draws this line: its ready locator is the dashboard list, while its predicate also compares two labels and a class. `CreateOrganizationPage` follows the same shape rather than promoting all fifteen of its `exists()` calls to ready locators, because `getReadyLocators()` also feeds `open()`, and a page that waits for fifteen elements on every navigation is slower and fails navigation where it used to fail an assertion. The default `isVisible()` covers the anchor; a component needing more overrides and calls `super.isVisible()` first.

### Boolean, not throw

Kept deliberately. `findElements()` logs `{locator, matches, phase, url, title, pageText}` before the catch and `exists()` logs the failing locator, so a false result is diagnosable from the run log. Throwing would improve only the assertion message, at the cost of seventeen call sites, and would leave a method named `isVisible` that raises.

### Ordering fixes the negative assertion, waiting does not

`doesNotExist()` queries once and does not wait. Giving it a wait does not help: if the element has not rendered, the condition "absent" is satisfied immediately either way. The fix is that a component confirms its ready elements before evaluating any absence. `doesNotExist()` stays an instant query and gains a comment saying it is valid only once the component is confirmed present.

## Risks / Trade-offs

- A rest-parameter base signature accepts any arguments at the type level → call sites hold the concrete type (`MainPage`, `NavBarFragment`), not `BaseComponent`, so TypeScript still checks them against the narrow override. This is the trade-off `Navigable` already accepted.
- `isVisible()` reporting false when a component declares no ready elements could surprise an author who forgot to declare them → that is the intent. A vacuous true would make an unimplemented predicate look like a passing assertion.
- Serialising the negative checks after the positive ones makes `NavBarFragment` marginally slower → the negatives are instant queries; the cost is one round trip, not one timeout.
- Renaming across seventeen call sites in one commit risks a partial rename → commits 2 and 3 split pages from fragments, and a `grep` for the two old names is the completion check for each.

## Migration Plan

Four commits on `rprec/82-isvisible-base-component`, each green on its own:

1. Core only. `Verifiable`, the move of `getReadyLocators()`, the default `isVisible()`. No call site changes, both suites still pass, which proves the default breaks nothing.
2. The two pages and their two call sites. `waitUntilLoaded()` removed here; it has none.
3. The six fragments and the fifteen call sites in `organizations.test.ts`.
4. The ordering fix in `NavBarFragment` and the comment on `doesNotExist()`.

Rollback is per commit; none depends on a data or pipeline change.
