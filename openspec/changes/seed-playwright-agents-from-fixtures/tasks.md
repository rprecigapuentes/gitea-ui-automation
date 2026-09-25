## 1. Give the starting states a home the suites do not run

- [x] 1.1 Add the `seeds-chrome` project to `services/playwright-native/playwright.config.ts`, listed
      first, with `testDir: "./tests/seeds"`, and add `**/seeds/**` to the `testIgnore` of the
      browser projects. Verify with `npx playwright test --list --project=chrome`, which must show no
      file under `tests/seeds`, and with `--project=seeds-chrome`, which must show only those.
- [x] 1.2 Replace `tests/seed.spec.ts` with `tests/seeds/seed.spec.ts`, built on
      `fixtures/issues-fixtures.ts`, signing in through `sessionManager.loginAsOwner()` and taking
      `owner` and `repository` from the fixtures. Verify it passes under `--project=seeds-chrome` and
      that the repository it created is gone afterwards.
- [x] 1.3 Add `tests/seeds/anonymous.spec.ts`, which opens the sign-in page with no session. Verify it
      passes under `--project=seeds-chrome` and that `tests/seeds/seed.spec.ts` stays the only file
      whose name contains `seed`.

## 2. Teach the generator what to take from the starting state

- [x] 2.1 Add the rule to the repository's own section of
      `.claude/agents/playwright-test-generator.md`: values a fixture owns are read from the fixtures
      the starting state declares, never written into the test as literals, and credentials are
      resolved per browser as the suites resolve them. Verify by reading the file back: the rule sits
      in the maintained section, not in the stock text above it.
- [x] 2.2 Record in that same section that `npx playwright init-agents` rewrites these files and can
      write a fresh empty `tests/seed.spec.ts`, so the starting states are re-applied after an
      upgrade alongside the section itself. Verify the sentence names the file it would write.

## 3. Prove it end to end

- [ ] 3.1 Regenerate the issue-creation scenario of #125 from the default starting state. Verify the
      emitted file declares `owner` and `repository` as fixtures, contains no `agent-baseline` and no
      sign-in steps, and passes under `--project=chrome` against a repository the fixtures created.
      The file is evidence: it stays in the branch history, not in the merged diff, as
      `openspec/changes/archive` already does for the #125 specs.
- [ ] 3.2 Generate a sign-in scenario from `tests/seeds/anonymous.spec.ts`, naming it in the plan.
      Verify the plan records that path as its seed and the emitted test performs the sign-in itself.
- [ ] 3.3 Run `npm run format`, `npm run lint` and `npm run typecheck`, the three checks the pipeline
      runs, and verify all three pass.
