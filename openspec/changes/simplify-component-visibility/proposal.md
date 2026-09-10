## Why

The `isVisible()`/`getReadyLocators()` pairing just landed by `isvisible-base-component` turned out to still carry redundancy: `exists()` and `doesNotExist()` duplicate what a per-locator `isVisible()` already means once presence and visibility are one wait, and every component with more than one shape of "visible" (owner vs. member, main-page vs. organization-page navbar) ended up with a single `isVisible` override branching internally on a boolean or enum, rather than the caller stating which locators it means.

## What Changes

- `BaseComponent.isVisible(locators: By | By[], root?, timeoutMs?)` becomes the one method for "does this exist and is it visible", taking locators explicitly. It replaces `exists()`; `doesNotExist()` becomes `isVisible(locator, root, 0)` negated, `timeoutMs: 0` meaning an instant single check.
- `getReadyLocators()` is removed. No component's `isVisible` is overridden anymore.
- **BREAKING**: a component with more than one shape of "visible" exposes multiple distinctly-named predicates (e.g. `isVisibleForOwner()`/`isVisibleForMember()`), each building its own locator list and calling `isVisible()` directly, instead of one predicate branching on a parameter.
- `BasePage.open()` takes `readyLocators: By[] = []` explicitly instead of reading `getReadyLocators()`. A page needing a post-navigation wait overrides `open()` once to supply its own list.
- `findElements`/`findElement` collapse presence and visibility into a single wait (was two phases) and drop the page-state diagnostic dump on failure; Selenium's own timeout error is enough.
- Not changing: `click`, `type`, `getText`, `getAttribute`, `actAndWaitFor`, `clickAndWaitFor`, `typeAndWaitFor`.

### Out of scope

- Any Gitea-facing behavior — only how a page object answers "is this here" changes.
- A factory/strategy abstraction for picking between a component's visibility predicates. Named methods are enough at this scale.
- Reworking `click`/`type`/etc. — already match the intended "act, then wait" flow.

## Capabilities

### Modified Capabilities

- `page-objects`: the visibility-predicate contract changes from a single `isVisible()` name (optionally overridden per component, sourced from a `getReadyLocators()` property every page/fragment declares) to an explicit-locators `isVisible(locators)` with no inherited "ready" concept, and a component with multiple visibility shapes exposes multiple named predicates instead of one branching on a parameter. Opening a page moves from an implicit `getReadyLocators()` wait to an explicit list passed to `open()`.

## Impact

`core/selenium/ui/base-pages/base-component.ts` and `base.page.ts`; the 7 page/fragment classes that currently override `isVisible` or declare `getReadyLocators()` under `business-logic/selenium/ui/pages/`; call sites in `services/gitea-selenium-vitest/tests/organizations.test.ts`, `services/gitea-selenium-vitest/tests/login.test.ts`, and `services/gitea-selenium-cucumber/features/step-definitions/login.steps.ts`. No dependency, driver or pipeline change.
