# Proposal

## Why

The `playwright-native` suite covers creating an issue only when both a title and a description are given. Gitea accepts an issue with a title alone, which was confirmed in the browser during the exploration recorded in `specs/create-issue.plan.md`: the description field is optional and the issue is created and rendered with an empty body. Nothing in the suite asserts that today, so a regression that started requiring a description would pass unnoticed.

This change adds that one scenario. It is deliberately small, because its second purpose is to exercise the path that issue 125 added to the apply stage, where a task that adds a UI test is delegated to the `playwright-test-generator` subagent rather than written by hand.

## What Changes

- Add `tests/create-issue/title-only.spec.ts` to `services/playwright-native`: log in as the owner, open the new-issue form for a repository, fill only the title, submit, and confirm the issue is created with the entered title, an empty body and the `Open` state.
- Add to `business-logic/pages/issues/` whatever page-object method the scenario needs and does not find, rather than reaching past the page objects from the spec.

The spec reaches the browser only through `pageObjects`, imports `test` and `expect` from the service's fixtures, and names its data through `testDataName`, as `happy-path.openspec.spec.ts` already does.

## Capabilities

No requirement text changes. One scenario of the application under test is added to a suite whose fixture and page-object layers already exist. `skip_specs: true`.

## Impact

New: `services/playwright-native/tests/create-issue/title-only.spec.ts`. Possibly modified: the issue page objects under `business-logic/pages/issues/`, if the scenario needs a method that does not exist.

## Out of Scope

- The empty-title and whitespace-title validation scenarios from the same plan. They assert native browser validation rather than application behaviour and deserve their own change.
- Porting this scenario to Gherkin. The `playwright-bdd` workspace is Gitea issue 126 and does not exist yet.
- The two page-object gaps reported during the issue 125 run, the avatar predicate on `NavBarFragment` and the composite form-loaded predicate on `CreateIssuePage`. Both are real work and neither is needed here.
- Running the scenario on firefox and edge. The branded builds are not installed on this machine.
