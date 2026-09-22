## Context

Every existing visual spec declares exactly one `test()` per file (see `tests/non-functional/visual/**/*.spec.ts`); none of them generate tests from data. This change's seven cases share the same flow (open the form, type a name, submit, check the result) and differ only in the name and why it's rejected, which is the shape a data table fits.

## Goals / Non-Goals

**Goals:**

- One independently reported, independently passing/failing test per case, each with its own baseline.

**Non-Goals:**

- A reusable "data-driven test" helper or fixture: this is the first spec of this shape: introduce the pattern inline and extract a helper only when a second spec needs the same shape.
- Asserting on the rejection reason's text.

## Decisions

**Generate the five pure-format cases from a `{ name, reason, baselineSlug }[]` array with a `for...of` at module scope, calling `test(...)` once per entry**, rather than:

- _One `test()` with a `test.step` per case_: a `test.step` failure doesn't fail the whole test independently in the report the way Playwright's own soft-screenshot assertions already do per check within one test (see `issue-form.spec.ts`) — but bundling seven unrelated rejections into one test also means one flaky case (e.g. a timing issue on the fourth) obscures the other six's results in a single pass/fail. Seven independent tests keep each case's outcome legible on its own.
- _`test.describe.parallel` with a shared `beforeEach`_: this suite has no `beforeEach`/`afterEach` anywhere (state is prepared inline per test, per the existing "prepares its state through the API inside the test" requirement); a shared hook here would be the first of its kind and isn't needed since only one of the seven cases needs setup (case 7's precondition organization).

**Keep the username-collision and already-exists cases as two separate `test()`s outside the loop**, not additional rows in the same array: the array's five rows share an identical body (type the literal value, submit, check); these two need different setup (the signed-in owner's own username; an organization created through the API first) that would otherwise need per-row conditionals in the loop body, which is harder to read than two short, explicit tests.

**No baseline recorded and no mask added in this change**: matches how `main-view.spec.ts` originally shipped ("it carries no masks yet, so it fails visibly until the regions that belong to a user are masked" — `playwright-visual-testing` proposal). The person asked for exactly this: the checks stay unmasked and unrecorded until they hand over which regions vary, and the pipeline's existing fail-on-missing-baseline behavior (`revert-visual-workflow-manual-baselines`) is what turns that into a visible CI failure once this merges, rather than a silently-passing first run.

## Risks / Trade-offs

- Running these locally without `--update-snapshots` still auto-writes and passes on a workstation that has no committed baseline (Playwright's own default behavior for a missing snapshot) → only CI's compare mode makes the absence visible, per the workflow behavior already in place; this is expected, not a gap this change needs to close.
