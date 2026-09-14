## Why

Seven tests fail on every CT run, across both suites; four on the same line: `expect(await mainPage.hasExpectedElementsDisplayed()).toBe(true)`. They are intermittent: in run #280 two project-board scenarios failed at that assertion while two others passed, same browser, same freshly built instance.

The DOM was probed against the instance under test rather than assumed. On Gitea 1.27.3 the dashboard renders `[{class "item active", text "Repository"}, {class "item", text "Organization"}]` for a user created seconds earlier with no repositories and no organizations, and the secondary nav's context switcher resolves to exactly one visible element whether its dropdown is open or closed. Every locator and every compared value is correct. What is missing is the waiting: the checks read the screen once, and nothing waits for the navigation that login causes.

## What Changes

- `LoginPage.login()` waits for the navigation it triggers. It submits the form and returns immediately today, so the next line asserts against whatever page the browser happens to be on. `BaseComponent.clickAndWaitForUrl` already exists for exactly this shape.
- `MainPage.hasExpectedElementsDisplayed()` waits until its three conditions hold, instead of resolving three elements and comparing once.
- `isVisible` logs the locator it failed on. `openspec/specs/page-objects/spec.md` already requires this and the code does not do it: every failure is collapsed into a silent `false`, so a red CI run cannot say which of four causes it was.
- `NavBarFragment.waitForElements()` and `login.steps.ts` stop discarding the booleans they compute, so a failure is reported where it happens rather than two steps later.
- `waitForLabel`, `waitForRow` and `getChip` stop re-scanning a list they have already scanned, which is what pushes AT-ISS-02 over its 30s budget.

### Out of scope

- **The `organizationDropdown` locator.** Suspected and cleared: `.text [class=gt-ellipsis]` matches exactly one visible element on 1.27.3, and `gt-ellipsis` is that version's current class, not a stale one.
- **The 3000ms implicit wait** in `driver.factory.ts`. It is the largest single saving available to AT-ISS-02 and it affects both suites, so it is agreed separately rather than folded in here.
- **Raising `testTimeout`.** A safety net if AT-ISS-02 still exceeds 30s, not this change.

## Capabilities

### Modified Capabilities

- `page-objects`: gains the requirement that an action whose outcome is a navigation waits for it, and that a composite readiness check waits for its condition rather than sampling it once.

## Impact

`core/selenium/ui/base-pages/base-component.ts`, `business-logic/selenium/ui/pages/authentication/login.page.ts`, `.../common/main.page.ts`, `.../common/fragments/nav-bar.fragment.ts`, `.../issues/label-list.page.ts`, `.../issues/milestone-list.page.ts`, and `services/gitea-selenium-cucumber/features/step-definitions/login.steps.ts`. No test assertion changes.
