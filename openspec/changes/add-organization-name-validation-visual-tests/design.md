## Context

Every existing visual spec declares exactly one `test()` per file (see `tests/non-functional/visual/**/*.spec.ts`); none of them generate tests from data. This change's seven cases share the same flow (open the form, type a name, submit, check the result) and differ only in the name and why it's rejected, which is the shape a data table fits.

## Goals / Non-Goals

**Goals:**

- One independently reported, independently passing/failing test per case, each with its own baseline.

**Non-Goals:**

- A reusable "data-driven test" helper or fixture: this is the first spec of this shape: introduce the pattern inline and extract a helper only when a second spec needs the same shape.
- Asserting on the rejection reason's text.

## Decisions

**Generate all seven cases from one array with a `for...of` at module scope, calling the same `test(...)` once per entry**, rather than:

- _One `test()` with a `test.step` per case_: a `test.step` failure doesn't fail the whole test independently in the report the way Playwright's own soft-screenshot assertions already do per check within one test (see `issue-form.spec.ts`) — but bundling seven unrelated rejections into one test also means one flaky case (e.g. a timing issue on the fourth) obscures the other six's results in a single pass/fail. Seven independent tests keep each case's outcome legible on its own.
- _`test.describe.parallel` with a shared `beforeEach`_: this suite has no `beforeEach`/`afterEach` anywhere (state is prepared inline per test, per the existing "prepares its state through the API inside the test" requirement); a shared hook here would be the first of its kind and isn't needed since only one of the seven cases needs setup (case 7's precondition organization).
- _Two of the seven as separate `test()`s outside the loop_ (an earlier draft): the username-collision and already-exists cases need different setup (the signed-in owner's own username; an organization created through the API first) than the five literal-value cases, which made it tempting to pull them out as their own tests. That meant three near-identical copies of the same open/type/submit/check body. Rejected: every row runs through the exact same `test(...)` call site.
- _A `{ kind: "static" | "username" | "existing" }` discriminated union with a `switch`_ (a second draft): still one test, but the body branched on `kind` to decide what to do. Rejected as still a distinction between rows, just moved from three test-call-sites into one `switch`.

Every case's `name` is instead a function, `(context) => string`, called the same way for all seven rows (`name({ existingOrganization, owner })`); the five literal cases just ignore the context and return their constant. The test body never branches — it always calls `name(...)`, types what comes back, and runs the same steps. The two cases that need a runtime value (the signed-in owner's username; the API-created organization's name) get it exactly the same way the five literal ones "get" theirs: from the one function every row already carries.

**The "an organization already exists" precondition is requested by every row through the `existingOrganization` fixture**, not only the row that needs it: the fixture is destructured in every generated test, so its creation (and `fixture.ts`'s existing `cleanupCreatedOrganization` auto-fixture removing it afterward) runs identically for all seven, whether or not that row's case reads the organization it created. `organizations-fixtures.ts` already has this exact fixture ("An organization already exists" in the Cucumber smokes, per its own comment), but it extends a different base than `visual.fixture.ts` and Playwright can't merge two independent `.extend()` chains — so this spec re-declares the same fixture, word for word, on top of `visual.fixture.ts`'s `test` instead of importing it.

**All seven checks share one baseline name (`organization-create-form-invalid.png`)**, not one per case: the page's layout (nav, "New Organization" panel, form fields, visibility radios, permissions checkbox, button) is identical across every case; only the flash message text and the typed name in the input differ, and both are meant to be excluded by the mask once it's provided. This is the same pattern `main-view.spec.ts` already uses for its two accounts against one `main.png`, generalized from two checks to seven. A per-case baseline was the first draft, but it multiplies the images to review for a difference that the mask is meant to erase anyway, and the point of masking is exactly to make unrelated content comparable against one reference.

**No baseline recorded and no mask added in this change**: matches how `main-view.spec.ts` originally shipped ("it carries no masks yet, so it fails visibly until the regions that belong to a user are masked" — `playwright-visual-testing` proposal). The person asked for exactly this: the checks stay unmasked and unrecorded until they hand over which regions vary, and the pipeline's existing fail-on-missing-baseline behavior (`revert-visual-workflow-manual-baselines`) is what turns that into a visible CI failure once this merges, rather than a silently-passing first run. Verified locally: recording the shared baseline from one case and running the other six against it without a mask fails all six on the flash message and typed name, exactly the gap the mask is meant to close.

## Risks / Trade-offs

- Running these locally without `--update-snapshots` still auto-writes and passes on a workstation that has no committed baseline (Playwright's own default behavior for a missing snapshot) → only CI's compare mode makes the absence visible, per the workflow behavior already in place; this is expected, not a gap this change needs to close.
