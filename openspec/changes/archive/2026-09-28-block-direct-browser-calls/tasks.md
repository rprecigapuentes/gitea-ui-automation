# Tasks

## 1. Make the rule mechanical

- [x] 1.1 Add the `no-restricted-syntax` block to `eslint.config.js`, scoped by `files` to
      `services/*/tests/**/*.ts` and `services/*/features/step-definitions/**/*.ts`, with one entry
      per pattern - `page.locator`, `page.goto`, `page.getBy*`, `driver.findElement`/`findElements`,
      `driver.wait` - each carrying the message that names the page-object route. Verify
      `npm run lint` stays green on the untouched tree, which is the check that the globs exclude
      `core`, the page objects, the fixtures, `features/support/` and `gitea-selenium-vitest/src/`.

## 2. Prove it bites and that it bites only there

- [x] 2.1 Put one deliberate violation of each of the five patterns into a spec, run `npm run lint`,
      and record here that each failed, at which file and line, and that the message named the route
      rather than the token. Revert the violations and verify the tree is green again.
- [x] 2.2 Verify the rule runs where code already passes: `eslint --fix` in `lint-staged` cannot fix
      a `no-restricted-syntax` error, so a commit carrying one is refused, and the `quality` job of
      `.gitea/workflows/ci.yml` runs `npm run lint`. Verify by staging a violation and attempting a
      commit.
- [x] 2.3 Run `npm run format:check`, `npm run lint` and `npm run typecheck`, and one functional
      suite, to confirm the passing suites are unaffected.

The five patterns fire as six messages, because `findElement` and `findElements` are one entry read
as a regex. A probe carrying all of them was linted from each of the four suites' spec and
step-definition directories and reported six errors in each, at the line of the call, naming the
route: the page object that owns the page, `open()` for navigation, and `BaseComponent` for a wait
no page object has yet.

The same probe copied into `business-logic/pages`, `core/page-objects`,
`services/playwright-native/fixtures`, `services/gitea-selenium-cucumber/features/support` and
`services/gitea-selenium-vitest/src` reported none, which is the exclusion working: the rule does
not exist over the code that owns the browser. `services/playwright-bdd/tests/seeds` reported none
either, being in the config's `ignores` already.

Staging the probe and committing was refused by the pre-commit hook, `eslint --fix` having nothing
it can fix about a `no-restricted-syntax` error, and HEAD was left where it was. `format:check`,
`lint` and `typecheck` are green on the untouched tree, and `playwright-native` passes 16 tests on
each of the three browsers under `test:parallel`.
