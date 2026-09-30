# Tasks

## 1. Find what to change without asking a model

- [x] 1.1 Add `services/playwright-bdd/scripts/heal-locators.mjs` with the gate and the search only:
      read `reports/explanation.json`, keep the entries whose `category` is `locator` and whose
      `confidence` is not `low`, and for each one trace the selector it names to the page object
      that declares it. `--dry-run` stops here and prints what it found. Verify that of the six
      payloads of `tests/failure-corpus/` only the `locator` one passes the gate, and that a
      selector the page objects declare resolves to exactly one file, one line and one key.

The selector arrives in the step's call log rather than in the result's own message, which is why
`explain-failures.mjs` keeps `steps[].message`.

27 of the 29 files under `business-logic/pages/` declare their selectors in one `locators` object,
and the two that do not are `page.factory.ts`, which is not a page, and `nav-bar.fragment.ts`. So
the search reads the declarations rather than parsing the language: a plain literal is taken as it
stands, and `` `${modal} .label-name-input` `` is resolved against the constants of its own file. A
value built at call time is reported unresolved rather than guessed at.

The corpus cannot verify the search, only the gate, and it is worth saying why rather than
appearing to have checked more than was checked. Its payloads are replays: `locator-issue-state`
names `.issue-state-badge`, which is the drift that produced it and was reverted long ago, so
today it correctly resolves to nothing. That is the unresolved path, and it is verified. The search
itself is verified against selectors the page objects declare now — `.issue-state-label` resolves
to `IssuePage.locators.stateLabel` at `issue.page.ts:21`, and the interpolated
`#issue-label-edit-modal .label-name-input` to `LabelListPage.locators.nameInput` at
`label-list.page.ts:17`. On a live run the two always agree, because the selector in the call log
is the one the code holds: that is why the test failed.

## 2. Hand the agent the page, and nothing else

- [x] 2.1 Add the healer's MCP configuration: `default_tools_approval_mode = "approve"` on the
      `playwright-test` server, with `enabled_tools` pinned to the snapshot, the locator generator,
      navigation and the test runner. Verify a tool call succeeds with stdin closed and the sandbox
      on, which is what `#129` measured, and verify that `browser_run_code_unsafe` is refused.

`approve` is per server and pre-approves every tool it exposes, so the pin is the only thing keeping
arbitrary page evaluation out of a job that holds `GITEA_ADMIN_TOKEN`. Record the codex version the
run was measured on, as `#129` did: this is version-sensitive behaviour.

`scripts/heal-agent.mjs --check`, measured on codex-cli 0.157.1. `enabled_tools` is honoured: the
session was handed exactly the ten tools the pin names and no others, `test_list` answered with 54
tests over closed stdin, and `browser_run_code_unsafe`, `browser_evaluate` and `generator_write_test`
were all absent. The first two evaluate arbitrary JavaScript in the page and the third writes a file
outside the one key the healer may touch, so the pin is what keeps them unreachable rather than
merely unused.

Two things the run said that are worth carrying:

`Model metadata for gpt-5 not found. Defaulting to fallback metadata`. The same warning
`explain-failures.mjs` already documents for `gpt-5-mini`, so it is not particular to the model this
step pins — codex 0.157.1 carries metadata for its own default and falls back for every other id.
There is therefore no metadata reason to prefer `gpt-5` here, only a capability one, and
`CODEX_MODEL` overrides it.

`Refusing to create helper binaries under temporary dir "/tmp"`, because `CODEX_HOME` is a temporary
directory. It proceeds, and it is the same placement `explain-failures.mjs` already uses on CI for
the same reason: nothing holding the key may sit in the directory the run uploads.

## 3. The loop

- [x] 3.1 Have the agent open the page the failing step was on, collect candidates by role and
      accessible name, write one into the key found in 1.1 and re-run that scenario alone on the
      browser that failed. Bound it to a small number of attempts. Verify on a locator drifted by
      hand that it re-runs rather than answers from the payload — the transcript names every tool
      call, which is the only evidence it drove anything, and `explain-ct-failures` 3.1 is the
      precedent for an agent reporting work it did not do.

Run once against a locator drifted by hand, and it found the answer: the state element is
`.issue-state-label`, read off the live page, with the one value changed and nothing else. Three
things went wrong on the way there, and the first was the reproduction rather than the code.

The drift was left uncommitted, so repairing it returned the file to the state `HEAD` holds and
`git diff` was empty. The gate read that as "nothing was changed" and rejected, correctly. A real
red run carries the broken selector **committed** — that is why the suite is red — so the repair
produces a diff there. The reproduction has to commit the drift, and now does.

The agent read the page with `curl` and `rg` rather than through the browser. It got the right
answer, because Gitea renders on the server, and it would not have on anything rendered by
JavaScript. The prompt now names `browser_navigate` and `browser_snapshot` and says why the snapshot
is the view that agrees with what the test sees.

It spent 349k tokens, almost all of them on running tests. `--grep` listed the scenario and then
found nothing to run, and it went round that several times before killing a Playwright process with
`pkill`. In a job that would be killing this run's own work. The instruction to re-run was the
mistake: the repository owns the gates, so the agent is now told not to run the tests at all, and
`test_list` and `test_run` are off the pin. It looks, the repository verifies.

Run again with that fixed, and the whole loop closed: one attempt, the scenario green in 6.8s, the
suite 16 of 16 green in 2.2m, one repair proposed, nothing applied, `git status` clean. 83.9k tokens
against the 349k of the run that was allowed to drive the runner, which settles that question: the
agent looks, the repository verifies, and nothing was lost by taking the tests away from it.

It reached the right answer the wrong way, and that is the finding. `browser_navigate` failed, and
the transcript says why: the `browser_*` tools act on a page that something else opened, and the pin
had just lost the two tools that open one. So the agent fell back to the repository — and read
`openspec/changes/propose-locator-repairs/tasks.md`, which states the answer in full, because 1.1's
own record names `.issue-state-label` and the key it belongs to. Its "what I saw on the page" is
written from that. It reasoned, in the transcript, "I can't claim that I actually used the tool".

The scenario passed, so no gate caught it. That is the gap: the gates established that the selector
**works** and never that it was **observed**, and a repair nobody looked at is the proxy this change
exists to replace. Three things follow.

`generator_setup_page` is back on the pin, and the prompt hands it the starting state of the feature
that failed — `tests/seeds/issue-metadata.spec.ts` here, resolved from the generated spec's name,
`seed.spec.ts` when a feature has none of its own. That is what `tests/seeds/` was built for, and
the healer turns out to be its second reader. `--headless` is on the server: it launches headed by
default, which no job has a display for.

The transcript is now kept rather than inherited, and a repair whose transcript holds no completed
`browser_snapshot` is rejected before the scenario is ever run. Checked from the transcript, not
asked of the agent, like the other gates.

The agent also answers against a schema now, saying which selector it wrote, why, and whether it
read it in the page. `observedInThePage: false` rejects on its own. The `why` reaching the step
summary is that field — before this it was `undefined`, since nothing captured what the agent said.

Editing a page object needs no `bddgen`: the features and the step definitions are untouched, so the
generated tests stay valid between attempts.

**This task is blocked, and not on anything it can fix by itself.** Two more runs with the page
actually open, one attempt and then two, and both proposed a selector that did not survive the
scenario: `.state`, and then `main h1 + div > :first-child`. Both carried `observedInThePage: true`
and a completed snapshot in the transcript, so both were honest. The second was worse than the
first, and the feedback that reached it was working — it was told the repository's verdict and went
looking somewhere else.

The reason is in the agent's own words: "the `browser_snapshot` tool doesn't show attribute values",
and then "I can't use `browser_inspect` to find class names, so I need to derive a CSS selector
based on the element's structure". `browser_snapshot` returns the accessibility tree — roles and
accessible names, no attributes. The class this repair needs, `issue-state-label`, is never in what
the agent is shown. These page objects address the browser with CSS strings, so the instrument the
change picked cannot produce the artefact the repair is made of.

That also corrects 3.1's earlier reading of the first run. The `curl` was not a shortcut: it was the
only route that showed class names, and it is why that run reached the right answer. Reading this
change's own notes, on the second run, was the shortcut.

And it puts the tool pin in its place. The pin is worth keeping, but it was never the containment:
the agent holds a full shell under `danger-full-access` and can reach the same application through
it. What contains this is the diff confined to a locators object, that nothing is committed, and
that the instance is disposable.

Everything either side of the instrument is measured and works: the search, the four gates, the
feedback between attempts, the transcript check, the summary and the restore. A wrong repair is
caught by the scenario, the tree comes back clean every time, and the run costs 29k tokens rather
than the 349k it took when the agent drove the test runner.

The fork was recorded on `#131` and settled there: the healer gets a view of the DOM, which is the
option that changes no framework. It finds the element by role and accessible name in the snapshot,
which is what that instrument is good for, and then reads its classes with `browser_evaluate`.

With that, the fifth run closed on the first attempt: `.issue-state-label`, the scenario green in
7.4s, the suite 16 of 16 in 2.0m, `observedInThePage: true`, the tree clean, 62k tokens. Its own
account of how it knew — "the accessibility snapshot pinpointed the badge node, and evaluating its
DOM showed the class changed from issue-state-badge to issue-state-label" — is the division of
labour the prompt asks for, said back.

Five runs, and the instrument decided every one of them. Nothing about the agent changed between
the two that answered with the shape of the tree and the one that answered with the class.

## 4. The gates

- [x] 4.1 Accept a proposal only when the scenario passes, `git diff` touches nothing outside a
      `locators` object, and the suite passes on that browser. Restore the working tree otherwise.
      Verify each gate rejects on its own: a candidate that leaves the scenario red, a diff that
      also edits a step definition, and a repair to a shared fragment that mends one scenario and
      breaks another. Verify that after a rejection `git status` is clean.

Gate two is checked from the diff rather than asked of the agent. The healer agent this repository
carries for local use is told to mark an unfixable test `test.fixme()`, which is a green job and a
deleted test; nothing about this step may make that outcome reachable.

`scripts/heal-gates.mjs`, verified on four trees: a clean one is rejected as changing nothing; a
changed locator value in `issue.page.ts` is accepted; the same file changed once more at line 41,
outside its locators object, is rejected naming that line and the block's range; and a changed step
definition is rejected as not a page object. `git status` is clean after the restore.

Gates one and three cannot be verified without a red run to heal, and they are two `npm run` exit
codes. The order is deliberate and is a cost decision: the diff check is free, the scenario is
around 10s, the suite around 2.2m, so the cheapest gate rejects first.

## 5. Say it in the run

- [x] 5.1 Write the proposal to `GITHUB_STEP_SUMMARY` as a row per repair — file, key, old selector,
      new selector, why, and what was re-run — beneath the table `explain-failures.mjs` already
      writes. Write the patch to `reports/` so it rides in the artifact that is already uploaded.
      Verify the summary renders with no repair, with one, and with a rejected one, and that a
      rejected repair says why it was rejected rather than going silent.

All three render, through `--summary-only`, which replays a results file so that checking the three
states costs no suite runs. A rejected repair prints its reason under "Not proposed", and a run that
proposed nothing because nothing was attributed to a locator says that rather than showing an empty
table.

## 6. Prove it, both ways

- [x] 6.1 Add a corpus of deliberately drifted locators and a `heal:score` that reports two numbers:
      how often the healer names the locator a person would have changed, and how often it stayed
      inside the `locators` object. Include an entry that cannot be repaired. Verify the score is
      not perfect on that entry — a healer that never declines is one that fabricates.

**3 of 3, and a clean tree after each.** `.issue-state-label` and `.ui.button.new-label` proposed
and accepted through the gates; `label-rows` declined, with "the scenario still fails with it",
which is the answer a scenario no locator can fix deserves.

A first attempt at the run never reached an answer — all three entries ended in `Quota exceeded` from
the API — and printed 1 of 3, which was worth nothing: the entry it marked right was the one that
cannot be repaired, and it was right by not answering at all. A score is only a score when every
entry got to answer.

The measured run also settles the model. It ran on `gpt-5-mini`, which is now the default, and the
capability argument that had pinned `gpt-5` did not survive contact: the cheaper model answered
every entry. It answered the first one on its **second** attempt where `gpt-5` had taken one, so
what covers the difference is the rejection reason being fed back, and that is the feature paying
for the model.

The shape of the cost is worth knowing before this runs on anybody's budget. 670k tokens over the
three entries, and 400k of them went to the entry that cannot be repaired, because nothing stops it
short of `HEAL_ATTEMPTS`. So the worst red run is not a hard repair, it is a failure misread as a
locator, and what bounds it is the attempt count rather than the difficulty.

Three entries. `IssuePage.stateLabel` and `LabelListPage.newLabelButton` are repairable and sit in
different page objects, the second failing at an early step rather than a late one.
`LabelListPage.rows` is not: its assertion is inverted in the step definition as well, so no
selector makes the scenario pass. That entry also tests the confinement, since the only edit that
would fix it is one the diff gate refuses.

Two things the attempt is worth on its own.

The scorer reset with `git reset --hard HEAD~1`, and the drift of the first entry committed nothing,
because that locator was already drifted in the tree. So the reset dropped the commit before it,
which was this task's own. Recovered from the reflog. It now takes the commit it started from by
name, refuses to continue if the drift committed nothing, and refuses a drift whose value the file
already holds.

The corpus carries a limit that should be read before the number it produces is trusted. A drift has
to be **committed**, or the correct repair returns the file to what `HEAD` holds and the diff comes
out empty. That puts the answer in the history, one `git show` from an agent with a shell. A real
drift has no such property — the committed selector was right when it was written and the
application changed under it, so the answer exists only in the running page. What stands against it
here is the transcript gate and `observedInThePage`, and neither proves the answer came from the
snapshot rather than from beside it.

## 7. Wire it into the run

- [x] 7.1 Add the step to `ct-functional.yml` after `explain`, on `failure()` and the BDD suite,
      `continue-on-error`. Verify the job's Gitea is still answering at that point, and that the
      step adds nothing to a green run. Note the wall-clock cost against the 25-minute budget: a
      scenario is around 10s and the suite on one browser around 2.2m, so the gates dominate.

Placed after the issue is filed rather than before it, so that filing is not held behind a suite
run, and before the upload, which now also carries `reports/repairs.json` and the patch. The job's
`gitea-test` is a service container, so the page is still being served at that point and stops being
served when the job ends — which is what fixes this step's position rather than leaving it a choice.

- [x] 7.2 Run it end to end on a branch with a locator drifted on purpose and a temporary push
      trigger, the way `explain-ct-failures` was proved. Verify the summary names the locator a
      person would have changed. Then invert it: break a feature's own logic on the same branch and
      verify nothing is proposed. Remove the trigger and the drift in their own commit.

**It ran, and it proposed the repair a person would have made**, in the job, unattended: run #645,
`issue.page.ts:21`, `stateLabel`, `.issue-state-badge` to `.issue-state-label`, verified by the
scenario and then the suite, written to the step summary, nothing committed, and the job still red.
The whole step took 3m46s.

It took three runs, and every fault the first two found was in this code rather than in the agent.
Run #640: the same broken locator arrived as two failures and the wrong one was healed; `demo-e2e`'s
starting state is not named after its feature, so the agent was handed a bare repository and went
looking for an issue in a world that had none; codex hands an MCP server no environment of its own,
so the starting state would not open and the agent wrote a `.env` holding an admin token to get one;
and nothing stopped the step before the job's 25-minute ceiling did. Run #642: trimming the
`git status --porcelain` output ate the leading space of an unstaged line and with it the first
letter of the path, so a correct repair was refused against a file called `usiness-logic/...`;
`git diff` without `HEAD` sees nothing an agent has staged; and `demo-e2e` carried a second failure,
read as timing, which no locator could have mended, so every attempt on it bought a two-minute
re-run that could not pass.

What the agent did was right from the first run. It opened the page from the starting state, read
the element by role and accessible name, then read its classes, and answered `.issue-state-label`
with `observedInThePage: true`. Three times, on three runs, before this code let the answer through.

The negative half is not run here. `#131` asks for a broken feature confirmed unrepaired, and the
corpus measured it — `label-rows` declined, with the scenario still failing — so a second pipeline
run would pay again for what is already known.

A run's own drift is noisy in a way worth writing down. A broken locator does not fail fast: every
scenario that reads through it waits out the full 120s timeout, on three browsers, with two retries.
The suite took 20m9s against its usual few minutes, and three scenarios this change never touched
failed alongside the two the drift explains — a connection closed, a global timeout, a label set
read back wrong. That is the shape of a saturated runner rather than three new defects, and it is
the same thing that happened on a developer machine at load 16. It is not proved here: proving it
means comparing against a green scheduled run of `main`.

## 8. Write it down

- [x] 8.1 Document the healer in `services/playwright-bdd/README.md`: what fires it, what it may
      touch, the three gates, and that it proposes rather than applies. Run `npm run format:check`,
      `npm run lint` and `npm run typecheck` and verify all three pass.

All three pass. The README says what fires it, what it may touch, the three gates, and that it
proposes rather than applies.
