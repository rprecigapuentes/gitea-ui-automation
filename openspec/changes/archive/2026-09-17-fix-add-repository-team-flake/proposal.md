## Why

`gitea-selenium-cucumber`'s "Change team members permissions" and "Add a repository to a team" scenarios were failing on the step `I add the following repositories to each team:`, timing out around 5 seconds. This has been documented as flaky since 2026-09-14 (`openspec/changes/cucumber-demo-e2e/design.md:40`), before this branch — reported directly by the user hitting it in a normal run.

## What Changes

- `SpecificTeamFragment.addRepository()`'s `clickAndWaitUntil` call gets an explicit `15000` ms timeout instead of the default `5000`. The assignment re-render this waits on can outlast 5s under load — the same reasoning already applied to `clickRemoveTeamMemberButton` in this same file, which uses `15000` for an equivalent click-then-poll pattern.

### Out of scope

- The separate, already-mitigated `#remove-team-member` modal flake (`I remove the following team members:`, already has an explicit 25000ms Cucumber step timeout with its own comment) — surfaced once during verification under full 3-browser parallel load, unrelated to this fix, not touched.

## Capabilities

No requirement text changes — a timeout adjustment. `skip_specs: true`.

## Impact

Modified: `business-logic/pages/organizations/fragments/specific-team.fragment.ts`.
