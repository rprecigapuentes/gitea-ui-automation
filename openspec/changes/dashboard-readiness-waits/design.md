## Context

See proposal.md - Why. What shapes the approach is what the DOM probe ruled out. Against the instance under test (Gitea 1.27.3, the same version `ct.yml` pins, confirmed through `GET /api/v1/version`):

- A user created seconds earlier, with no repositories and no organizations, renders the dashboard tabs as `[{class "item active", text "Repository"}, {class "item", text "Organization"}]`. All three values `hasExpectedElementsDisplayed()` compares are correct. "A fresh CI account renders a different dashboard" is false.
- `.text [class=gt-ellipsis]` matches exactly one element, and it is displayed both while the context dropdown is closed and while it is open. `gt-ellipsis` is this version's class; there is no `tw-ellipsis` on the page. The locator is not stale.
- The dashboard is fully rendered 273ms after the login click on a developer machine.

So nothing is wrong with what the checks look for. What is wrong is that they look once, at a moment nobody waited for. CI is where that shows because it is slower and because every element lookup goes through the healing proxy, which adds a network hop per locator.

## Goals / Non-Goals

**Goals:**

- Remove the sampling, so a check that would pass a moment later passes.
- Make the next red CI run say which value failed. Today `isVisible` collapses four distinct causes into one unlogged `false`, which is why this took a DOM probe to diagnose rather than a log read.
- Keep every test assertion and every page object signature as it is.

**Non-Goals:**

- Making AT-ISS-02 comfortably fast. Only the wasted round trips inside page objects are addressed; the dominant cost is the implicit wait, which is out of scope.
- Touching the locators that the probe cleared.

## Decisions

**Wait for the navigation in `LoginPage.login()`, not in each caller.** Four call sites follow `login()` with an assertion about the destination, and each would otherwise need its own wait. `BaseComponent.clickAndWaitForUrl` already exists for "a click whose outcome is a navigation rather than an element", which is exactly this, and its comment says so. The alternative, having each caller wait, spreads one fact about the login form across four files and leaves the fifth caller to forget it.

**Add an action-free `waitUntil` to `BaseComponent` rather than calling `driver.wait` from the page object.** The repo's `CLAUDE.md` makes calling the driver from a page a review blocker, and `actAndWaitUntil` (which is `driver.wait(predicate)` after an action) already proves the shape belongs in the base class. `waitUntil` resolves to a boolean instead of raising, so `hasExpectedElementsDisplayed()` keeps returning a boolean and its four call sites keep their `expect(...).toBe(true)`.

**Log inside `isVisible`'s catch rather than letting it raise.** `openspec/specs/page-objects/spec.md` already requires both halves: report rather than raise, and name the failing locator in the log. The code does the first and not the second. This is bringing the code to the spec, not changing the contract.

**Return the row from the predicate instead of re-finding it.** `waitForLabel` and `waitForRow` today run `driver.wait(async () => (await findRow(name)) !== null)` and then call `findRow(name)` again for the value the predicate already had. Capturing it in a closure is the smallest change that removes a full second scan; with three rows at seven round trips each that is 21 per call, and AT-ISS-02 makes five such calls.

## Risks / Trade-offs

- **[Risk]** `clickAndWaitForUrl` needs a URL pattern, and the login form redirects to `/` on success but re-renders `/user/login` on failure. A pattern that also matches the login page would make the wait vacuous. → Match the destination only, so a failed login fails in `login()` naming the URL it waited for, instead of surfacing later as a confusing dashboard assertion.
- **[Risk]** Waiting for a composite condition converts what is now a fast `false` into a wait of up to the timeout when the condition genuinely never holds, making a real failure slower to report. → Accepted: the timeout is 5s, and a real failure being 5s slower is worth an intermittent failure disappearing.
- **[Trade-off]** The new log lines fire on every `isVisible` miss, including the deliberate absence checks that expect to miss (`isVisibleOnMainPage` calls `isVisible` with a 0 timeout precisely to assert absence). That is noise in the log on a passing run. → Accepted for now; it is the cheapest way to make the next CI run diagnostic, and quieting the intentional-absence path is a follow-up once the failures are understood.
- **[Risk]** The fix is verified against a developer machine where the race does not reproduce (273ms to render). Local green therefore proves nothing about CI. → The real verification is the CT run, and the added logging is what makes a second red run informative rather than another guess.
