## Why

The create-organization visual smoke only covers the happy path. Nothing visually checks what Gitea shows when the organization name is rejected — a disallowed character, a name that can't start or end non-alphanumeric, consecutive separators, spaces, a name that collides with the current user's own username, or one that already belongs to an existing organization. These are the seven negative cases a person on this project wants covered, driven from one data table so each is its own check.

## What Changes

- Add a data-driven visual spec: one Playwright `test()` per invalid-name case, generated from an array of `{ name, reason }` at module scope — the first spec in this suite to generate tests from data instead of writing one test per file.
- Five cases type a malformed value into the create-organization form and submit it (disallowed character, leading/trailing non-alphanumeric, consecutive non-alphanumeric, spaces).
- One case types the signed-in owner's own username as the organization name (name/username collision).
- One case creates an organization through the API first, with a name shared between the precondition and the typed value, then types that same name into the form (already-exists collision).
- Each case checks the resulting page against its own baseline, using the page object's (currently empty) volatile-region mask, the same way every other visual spec does.
- No baseline is recorded for any of the seven checks in this change, and no mask is added: the person asked for these to fail for now, until they hand over the mask selectors for the regions that legitimately vary (the flash error text's wording may carry dynamic content). The suite's own missing-baseline behavior ([pipeline] `revert-visual-workflow-manual-baselines`) is what will surface that failure in CI once this merges.

## Capabilities

### Modified Capabilities

- `visual-testing`: adds the requirement that a visual spec may generate more than one test from a data table, one baseline per case, instead of only ever declaring a single test per file.

## Impact

- `services/playwright-native/tests/non-functional/visual/organizations/` (new spec file). No page object changes: `CreateOrganizationPage` already exposes everything the cases need.

## Out of Scope

- Masking the flash error message or any other volatile region: left for the mask the person will provide.
- Recording baselines for these checks: deliberately left missing so the checks fail until the mask lands and baselines are recorded on purpose.
- Asserting on the error message's text or validating Gitea's own naming rules: the check is purely visual, same as every other spec in this suite.
