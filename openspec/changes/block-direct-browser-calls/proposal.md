## Why

`openspec/config.yaml` already says a test reaches the browser only through a page object, and names
`page.locator`, `page.goto` and `driver.findElement` in a spec as a review blocker. It is prose, so
the control is a reviewer reading a diff.

That was tolerable while a person wrote every spec. Two cases were just migrated by the Playwright
generator, and the agent definitions ask it to respect the architecture: a prompt is a request, not
a guarantee. The model will drift, and the drift lands in a generated file nobody wrote by hand.

The check carries no model and no judgement. It fails when a file under a suite's spec or
step-definition directory calls the browser directly, and it runs where code already passes:
`lint-staged` on commit and the `quality` job on CI. Generated code cannot reach a branch without it.

## What Changes

- `eslint.config.js` gains one `no-restricted-syntax` block, scoped by `files` to
  `services/*/tests/**/*.ts` and `services/*/features/step-definitions/**/*.ts`. Five selectors:
  `page.locator`, `page.goto`, `page.getBy*`, `driver.findElement`/`findElements` and `driver.wait`.
- Each selector carries a message naming the route through the page object, so the error says what
  to do rather than only which token is forbidden.
- No new dependency and no plugin: `no-restricted-syntax` takes AST selectors and a message per
  entry.

The rule is opt-in by glob, which is how `core` and the page objects are excluded - it does not
exist where they are. Support code is out of the globs for the same reason: `fixtures/`,
`features/support/` and `gitea-selenium-vitest/src/` build the strategy and the session, which is
where those calls belong. `tests/seeds/**` is already in the config's `ignores`.

Out of scope, deliberately: the sixteen `driver.get(page.getUrl())` calls and the one
`driver.getCurrentUrl()` in `gitea-selenium-vitest/tests`. They are Selenium's spelling of
`page.goto`, and `BasePage.open()` already replaces them, but the Definition of Done names five
patterns and this change implements those five. Widening the rule to Selenium's navigation
vocabulary is a separate decision, recorded outside the repository. Also out of scope: any change to
a spec, a page object or a workflow file.

## Capabilities

### Modified Capabilities

- `pipeline`: the quality gate fails a spec that reaches the browser without a page object.

## Impact

- `eslint.config.js`: one configuration block.

No spec changes, no page object, no workflow file, no manifest.
