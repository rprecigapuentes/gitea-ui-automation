## Why

`core/selenium/ui/base-pages/base-component.ts` has grown to 199 lines and eleven methods, and the predicate that answers "is this the page I expect" is duplicated across eight classes under two names: `hasExpectedElementsDisplayed()` in seven, `hasAllFormElements()` in one. `BasePage` carries three overlapping members for that one question: `getReadyLocators()`, consumed only by `open()`; `waitUntilLoaded()`, which has no call sites; and the per-class predicate. Nothing in the framework states that a page or fragment must be able to answer the question, so every new one invents its own answer and the name drifts again.

## What Changes

- `BaseComponent` gains `isVisible()`, defaulting to "every ready locator is visible", and a `Verifiable` interface mirroring the existing `Navigable`. The `...args: unknown[]` rest parameter already used by `Navigable` is what lets the eight implementers keep their differing signatures.
- `getReadyLocators()` moves from `BasePage` down to `BaseComponent`. Six of the eight implementers are fragments that extend `BaseComponent` and cannot reach it today. `BasePage.open()` consumes it unchanged.
- The eight predicates are renamed to `isVisible()`. Those whose body is only a list of `exists()` calls collapse to `getReadyLocators()` plus `super.isVisible()`.
- `waitUntilLoaded()` is removed.
- A component's negative assertions run after its ready locators are confirmed, not concurrently with them. `doesNotExist()` does not wait, so inside a `Promise.all` it can report absence before the component has rendered and the assertion passes green.
- Not breaking: the `Promise<boolean>` contract is unchanged. Only names, inheritance and call order move.

### Out of scope

- Changing the contract to throw. The rich diagnostic is already logged by `findElements()` before the catch; only the assertion message is poor, which does not justify moving seventeen call sites.
- Extracting wait conditions into a `conditions.ts`. Of the fourteen `driver.wait` calls in the repository, seven express Gitea business conditions that would sit in the wrong layer inside `core/`.
- The duplication between `LabelListPage.waitForLabel()` and `MilestoneListPage.waitForRow()`.
- Whether `isVisible()` should take parameters at all. The parameterised implementers keep theirs.

## Capabilities

### New Capabilities

- `page-objects`: what a page object and a page fragment must be able to answer about their own visibility, and in what order a component's positive and negative checks are evaluated.

### Modified Capabilities

None. `openspec/specs/` holds `pipeline` only.

## Impact

`core/selenium/ui/base-pages/base-component.ts` and `base.page.ts`; eight classes under `business-logic/selenium/ui/pages/`; seventeen call sites across `services/gitea-selenium-vitest/tests/` and `services/gitea-selenium-cucumber/features/step-definitions/`. No dependency, driver or pipeline change.
