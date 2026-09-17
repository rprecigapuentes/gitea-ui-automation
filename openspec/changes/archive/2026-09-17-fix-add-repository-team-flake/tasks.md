## 1. Diagnose and fix

- [x] 1.1 Ran the full suite, confirmed both failures land on the same step, `I add the following repositories to each team:`, both `TimeoutError: Wait timed out after ~5000ms`
- [x] 1.2 Traced it to `SpecificTeamFragment.addRepository()`'s `clickAndWaitUntil` call using the default 5000ms timeout, unlike the identical click-then-poll pattern in `clickRemoveTeamMemberButton` in the same file, which already uses 15000ms for the same "can outlast the default under load" reason
- [x] 1.3 Passed `undefined, 15000` to `clickAndWaitUntil` in `addRepository`
- [x] 1.4 Verified `npm run typecheck -w @gitea-automation/business-logic` and `npm run lint` green

## 2. Verify under the load that triggers this

- [x] 2.1 Ran `test:parallel` (all 3 browsers concurrently, which reproduces the load) — the target step passed in every scenario; a separate, already-mitigated `#remove-team-member` flake (own 25000ms Cucumber-level timeout, unrelated) surfaced once, not this fix's concern
- [x] 2.2 Re-ran the `@team-repository`/`@e2e` scenarios again standalone — 11/11 passed, including "Change team members permissions" (exercises the fixed path directly)
- [x] 2.3 Archive this change and commit
