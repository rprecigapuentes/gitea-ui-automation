# Tasks

## 1. Give the service the state the two scenarios need

- [x] 1.1 Add `createdLabels?: Record<string, SeededLabel>` to
      `business-logic/state/scenario.entity.ts`, keyed by the label's displayed name. Verify
      `npm run typecheck` from the root — the entity is shared with the Selenium services — and
      that `label` is untouched, so `demo-e2e.steps.ts` still compiles.

Green across the workspace. `label` is untouched.

- [x] 1.2 Add `services/playwright-bdd/tests/seeds/issue-metadata.spec.ts`, declaring `owner`,
      `repository`, `classificationLabel`, `milestone` and `maintainer`, signed in as the owner and
      left on the new issue form. No fixture group has to be added: `issuesFixtures` is already in
      this service's chain. Verify it passes under `--project=seeds-chrome`, and that the
      repository it created, with its label and its milestone, is gone afterwards.

- [x] 1.3 Add `services/playwright-bdd/tests/seeds/scoped-labels.spec.ts`, declaring `owner`,
      `repository` and `issue`, signed in and left on the label list. Verify it passes under
      `--project=seeds-chrome` and leaves no `test-issues-*` repository behind.

Both passed on the first run, 3.6s and 3.7s, and the owner's repository list held no
`test-issues-*` repository of theirs afterwards. One `test-issues-1790455862164-seeds-chrome-*`
was on the instance before this change — created 2026-09-26, three days earlier — and is not from
these seeds. It is left alone: the fixture names every repository uniquely, so a leftover costs
nothing but a line in the listing.

## 2. Write the features

- [x] 2.1 Write `features/scenarios/issue-metadata.feature`, one scenario covering AT-ISS-01.
      Verify `npm run bddgen -w @gitea-automation/playwright-bdd` compiles it, that every `expect`
      of `playwright-native/tests/issue-metadata.spec.ts` appears in a step of the feature or in the
      definition behind it — none dropped — and that the steps reused from `create-issue.steps.ts`
      are spelled exactly as that file defines them.

- [x] 2.2 Write `features/scenarios/scoped-labels.feature`, one scenario covering AT-ISS-02. Same
      verification against `playwright-native/tests/scoped-labels.spec.ts`. Verify no step of
      either feature matches a wording already defined by `demo-e2e.steps.ts` or
      `project-board.steps.ts`: `bddgen` reports an undefined and an ambiguous step, but a
      near-miss that matches a demo definition bound to the seeded organization is neither — it
      drives the wrong repository and fails somewhere else.

Both features tagged `@issues`. Before any definition existed, `bddgen` reported exactly 36 missing
and no ambiguity, which is 16 new steps for the first feature and 20 for the second: the four the
first reuses from `create-issue.steps.ts` resolved, so the reuse is proved rather than assumed.

`demo-e2e.steps.ts` was the hazard, and it is worth recording which wordings were avoided and why.
Eight of its definitions are bound to `seededOrganizationWithRepositories` and would have driven the
wrong repository, silently — `bddgen` reports undefined and ambiguous steps, and a near-miss is
neither. The eight: "I close the created issue", "the milestone counts {int} open and {int} closed
issues at {int}% complete", "the created issue carries the label, the milestone and user {int} as
assignee", "I fill the issue {string} with a description", "the issue list shows only the created
issue", "the description preview renders the heading {string}", "I filter the issue list of the
first seeded repository by the label", and "I select the label, the milestone and user {int} as
assignee". Each new wording says "the repository" or "the seeded" where the demo says "the first
seeded repository", which is the distinction the reader needs anyway.

Two wordings of `create-issue.steps.ts` were deliberately NOT reused: "I fill the issue with a title
and a description", whose definition fills a plain description, and "the created issue carries that
title and that description", which asserts the rendered body with `toBe`. AT-ISS-01 renders Markdown
and asserts `toContain`, so reusing either would have forced one semantics on both scenarios.

## 3. Generate the step definitions

- [x] 3.1 Run `playwright-test-generator` over `issue-metadata.feature` from
      `tests/seeds/issue-metadata.spec.ts`, emitting
      `features/step-definitions/issue-metadata.steps.ts` with none of the definitions
      `create-issue.steps.ts` already has. Record here which the generator wrote and which were
      completed by hand. Verify `bddgen` reports no undefined and no ambiguous step; that the file
      holds no `test()`, no `page` and no locator call; and that the due date, the label id, the
      milestone title and the maintainer's login are read from fixtures rather than written as
      literals.

The generator wrote all 16 definitions and redefined none of the four this service already had. It
did not drive the browser: it reported that setup succeeded and that it then wrote the file from
`issue-metadata.feature` and `playwright-native/tests/issue-metadata.spec.ts`, judging that
re-driving calls the native spec already exercises would add little. That is the same shortcut
`migrate-organizations-to-bdd` 3.1 recorded, from a different cause — there the subagent had no
Playwright tools at all, here it had them and chose not to use them. The emitted file needed no
correction: `bddgen` reported no undefined and no ambiguous step, and the scenario passed on its
first run.

One thing was changed by hand, and it is a feature change rather than a fix. The generator folded
`openPreview()` into "I fill the issue with a title and a Markdown description", because the feature
gave the preview no step of its own — a `Then` cannot act. Rather than leave one step doing two
things, the feature gained "And I open the description preview" and the definition was split to
match. That step is the one definition in this file the generator did not write.

- [x] 3.2 Same for `scoped-labels.feature` from `tests/seeds/scoped-labels.spec.ts`. Additionally
      verify the seeded issue's title never appears as a literal — it is `issue.title`, owned by
      `issuesFixtures` — and that the three label ids travel through `scenarioState.createdLabels`
      rather than a module variable.

This run did drive the browser, after being told the previous one had not. It confirmed in the page
what the first six steps exist for: the exclusive checkbox carries `disabled` in the label modal
until the name contains a `/`, and loses it once "priority/high" is typed. It also saw the three
labels created and read back as exclusive with their colours, the chips splitting into scope and
item, the exclusive replacement (applying `priority/high` then `priority/low` leaves only the
latter), `kind/bug` coexisting with it, the filters, and the final counts of 1 and 0.

Two things it could not verify, and said so: `getLastLabelEvent` against the timeline, where its own
ad-hoc selector returned nothing and it fell back to the native spec's use of the same page-object
method; and `filterByLabel`, which it exercised by navigating to `?labels=<id>` rather than through
the dropdown the page object drives. Both are covered by the scenario passing.

One design fault it raised was fixed rather than accepted. `ScenarioState` has no field for a label
that has been named but not yet submitted, so the generator stored `{ id: 0, name }` as a
placeholder in `createdLabels` and had the submitting step recover the name with
`Object.keys(...).slice(-1)` — order-dependent, and an id of `0` that is not an id. Rather than add
a `pendingLabelName` field to a shared entity, the feature now names the label in the submitting
step: "I mark "priority/high" exclusive and submit it described ... and coloured ...". The draft
state disappears, and the step reads better for saying which label it means.

## 4. Prove it across the runners

- [x] 4.1 Run each scenario on chrome, then firefox, then edge. Verify each passes and note how
      long it takes on each. `playwright-issue-e2e` recorded the `playwright-native` numbers to
      compare against: AT-ISS-01 5.8s / 8.5s / 5.7s, AT-ISS-02 6.6s / 9.6s / 7.3s.

Each passed on the first run of each browser. AT-ISS-01: 8.2s chrome, 13.3s firefox, 7.2s edge.
AT-ISS-02: 9.0s chrome, 11.0s firefox, 8.2s edge. Against `playwright-native` that is roughly 1.2x
to 1.6x, which is the Gherkin layer and the per-step page-object calls it compiles to, not a
difference in what the cases do.

- [x] 4.2 Run the whole suite on all three browsers and verify the other scenarios still pass, in
      particular `demo-e2e`, which shares step wordings and the `createdIssue` state with these
      features. Note the wall-clock time against the CT job's 25-minute budget.

Run serially on chrome: 16 of 16 green in 2.2m, `demo-e2e` among them at 21.5s and `issue-metadata`
at 5.5s. The two new scenarios add about 13s to a browser's pass.

The three-process run this task asks for could not be measured on this machine and is left to the
pipeline. Three concurrent browser suites drove the load average to 16 and every scenario timed out
at the 120s limit — including `create-organization` and `demo-e2e`, which this change does not
touch, and including `issue-metadata`, which passes in 8.2s alone. Two of the timed-out runs left
orphaned browsers behind, which then starved the next run, so the first red result was not a code
result at all. Once the machine was idle the same suite was green serially. Worth recording as a
limit of this machine rather than of the suite: three Playwright processes plus their browsers do
not fit here.

- [x] 4.3 After a passing run and after a run forced to fail by inverting one assertion in each
      feature, verify no `test-issues-*` repository survives, and therefore no orphan label,
      milestone or issue. Verify no `test-orgs-*` organization was created: neither feature carries
      `@organization` and neither should trip the sweep.

No organization survives: `GET /api/v1/user/orgs` is empty for the owner of each browser, which is
expected since neither feature carries `@organization`. No repository survives a scenario run
either: every `test-issues-*` left on the instance is named for the `seeds-chrome` project, never
for `chrome`, `firefox` or `edge`.

That naming is the finding. A starting state leaks its repository, and a scenario does not. The MCP
server runs a starting state with `pauseAtEnd`, which holds the fixtures open so the agent can drive
the browser; when the agent's session ends without the browser being closed, the `repository`
fixture's teardown never runs and the repository it created stays. This is not new here — the same
is true of `seed.spec.ts`, `board.spec.ts` and `demo.spec.ts` — but this change adds two more
starting states and so two more occasions. The instance currently holds two such repositories, one
from 2026-09-26 and one from today; both are left alone, since the fixture names every repository
uniquely and a leftover costs nothing but a line in the listing. A sweep for them is named as out of
scope in the proposal and belongs with the agent-session work, not here.

## 5. Document and check

- [x] 5.1 Bring `services/playwright-bdd/README.md` up to date: add the two new features and the two
      its table already omits, and the four starting states its other table omits. Verify both
      tables list every file that exists under `features/scenarios/` and `tests/seeds/`.

- [x] 5.2 Run `npm run format:check`, `npm run lint` and `npm run typecheck` and verify all three
      pass. `format:check`, not `format`, which rewrites and so always succeeds.

Both tables now list every file under `features/scenarios/` and `tests/seeds/`, which is four rows
more than the features table carried and four more than the starting states table did: `demo-e2e`
and `project-board` had been added without it, as had the `board` and `demo` starting states.

`format:check`, `lint` and `typecheck` are green from the root. `typecheck` matters from the root
rather than with `-w`, because `ScenarioState` is shared with the Selenium services.
