# Tasks

## 1. The reducer

- [x] 1.1 `services/playwright-bdd/scripts/explain-failures.mjs` collects the non-passing results of
      `allure-results/` and writes `reports/failures.json`: name, full name, browser, tags, the
      bounded `statusDetails`, and the top-level steps with their status.
- [x] 1.2 Verified by breaking one scenario on purpose: `failures.json` names the Gherkin step the
      feature file declares, and a result that passed with a retried internal wait produces no
      entry. Run over every result file on disk without throwing.

## 2. The explanation

- [x] 2.1 A JSON schema: test, failing step, category, confidence, reasoning, first thing to check.
- [x] 2.2 One model call per failed test, read-only and without tools, its answer merged into
      `reports/explanation.json`, and the same content written to the run's step summary when the
      workflow provides one.
- [x] 2.3 Verified against the `failures.json` of 1.2: the answer validates against the schema.

## 3. The corpus

- [x] 3.1 Reduced payloads of failures already diagnosed in `openspec/changes/archive/`, each with
      the category its own change assigns, plus one that cannot be diagnosed from what it published.
- [x] 3.2 A script that scores the explanation against them and prints the count.
- [x] 3.3 The score recorded here.

## 4. The workflow

- [x] 4.1 One step in `ct-functional.yml`'s existing Playwright job, conditioned on failure and on
      the BDD suite, before the upload that already runs, with its credential at step scope.
- [x] 4.2 The explanation added to the paths that job already uploads.
- [x] 4.3 Verified by one run with a scenario broken on purpose. Gitea offers `workflow_dispatch`
      only on the default branch, so the run is triggered by a temporary `push` trigger on this
      branch, as `playwright-visual-testing` 9.5 and `playwright-demo-e2e` 3.5 both did.
- [x] 4.4 Remove the temporary `push` trigger and restore the broken assertion, in one commit that
      touches nothing else, before the branch merges.

## Notes

The reducer was verified by breaking `the created issue is "Open"` on purpose: `failingStep` came
back as that line, and the raw result reduced from 14,985 to 1,789 bytes. Over the worst result in
the repository, the organizations `@e2e` at 128,675 bytes, the reduction is 29 times.

Two defects the results themselves found. A skipped test is not a failure, and there are 36 of them
on disk. An attachment is recorded as a step without a status, so reading "the first step that is
not passed" named a screenshot as the cause.

The Playwright image the job runs in does not carry `codex`, so the call goes through `npx --yes`
against a pinned version. A green run never fetches it, because the step only runs on failure.

`OPENAI_API_KEY` in the environment is not enough: codex reads its credential from its own home and
answers 401 until `login --with-api-key` has handed it over. The script does that itself, into a
temporary home, so nothing holding the key sits in the directory the run uploads.

The break of 1.2 turned out to be a better probe than intended. Expecting `"Closed"` where the
feature says `"Open"` is a mistake in the test rather than any of the six categories, and the answer
was `unknown` with high confidence, naming the contradiction and the line it is on.

**The score is 4 of 6.** The corpus holds six entries rather than eight, and both misses are
defensible:

| entry                           | expected    | answered          |
| ------------------------------- | ----------- | ----------------- |
| `environment-gitea-unreachable` | environment | environment, high |
| `locator-issue-state`           | locator     | locator, low      |
| `timing-board-reload-race`      | timing      | timing, high      |
| `unknown-truncated-artifacts`   | unknown     | unknown, low      |
| `application-swallowed-error`   | application | data, low         |
| `data-wrong-seeded-issue`       | data        | unknown, low      |

`application-swallowed-error` is the `parseBody` defect: the seeded users come back undefined, the
scenario times out adding one, and teardown raises "is not iterable". The answer reads that as the
state being incomplete, which it is; calling it `application` needs knowing that the API client
turns a 4xx into `undefined`, and no payload carries that.

`data-wrong-seeded-issue` cannot be answered by anyone. The step asserts
`expect(await …hasCard(title)).toBe(true)`, so all the failure records is `Expected: true Received:
false` — the card that was there and the one expected are both thrown away before the assertion.
**That is a finding about the step definitions, not about the explainer**: an assertion that
compares booleans cannot produce an explainable failure. It is out of scope here.

The `timing` entry could not be manufactured, and in the end did not have to be. Removing a page
object's readiness wait does not fail, because the board renders faster than the assertion arrives.
Shrinking a wait to 1 ms does not fail either, because `waitFor` evaluates its condition before it
checks the clock. This suite's waits are good enough that a timing failure needs real load, which
is why the archive's timing entries are all races found in the pipeline rather than at a desk.

`makeColumnDefault`'s race then reproduced on its own, in the regression run of this change: edge,
in `demo-e2e`, with exactly the message its own change records — a navigation to the board
interrupted by another navigation to the same board. That run is the corpus entry, and the answer
was `timing` with high confidence. It is also one more data point for that defect, which is still
open: three concurrent browsers, no retries, one of fifteen scenarios.

Two entries short of eight, then. The eighth was to be a second `application` case, and the one
that exists already carries that ground.

One prompt fix came from the score: told that `Before Hooks` and `After Hooks` are the same run's
setup and teardown, the answer stopped dismissing the teardown error as a separate incident.

## 5. Make the answer worth reading, and file it

- [x] 5.1 Collapse the failures by the step that failed before asking. Three browsers retrying one
      broken assertion produced nine results, nine calls and nine identical rows; they are one
      defect, and `browsers` and `attempts` carry how widely it reproduced.
- [x] 5.2 Let the reader open the files the trace names, rather than answer from the payload alone.
      The payload records what an assertion returned and never what it means, so a boolean one
      answered `unknown`/low nine times over. Reading `login.steps.ts:13` turned the same failure
      into `unknown`/high naming the inverted assertion and the line.
- [x] 5.3 `scripts/file-failure-issue.mjs`: one issue per distinct failure on the instance that
      holds the code, deduplicated by a fingerprint of test and failing step hidden in the body, so
      a flake that returns gains a comment rather than a second issue. `environment` is never filed:
      nothing in the repository changes because a container did not start. Verified against the live
      instance - issue #146 opened, then a second run commented on it instead of duplicating.
- [x] 5.4 One step in the workflow for it, with `GITEA_TOKEN_ISSUES` on that step alone.

The model was not raised. The first table came back `unknown` with low confidence on nine rows, and
the fix was neither the model nor the schema: it was that the reader could not see the code and was
being asked the same question nine times. `CODEX_MODEL` is honoured if it is set, so raising it is
one variable rather than an edit.

The taxonomy has a gap the classifier found rather than hid. A defect in the test's own assertion is
none of the six categories, and the answer was `unknown` at high confidence with the line named,
which is the behaviour `unknown` and `confidence` exist for. Widening the enum is a change of its
own.

## 6. Pin what it runs on, and measure it

- [x] 6.1 Pin the model. codex defaults to a frontier model with `reasoning effort: none`, which is
      neither what this needs nor what it should cost. `gpt-5-mini` at medium reasoning is the
      default, `CODEX_MODEL` and `CODEX_REASONING` override it.
- [x] 6.2 Answer a replayed payload blind. A corpus entry was captured from a state of the
      repository that no longer exists, so reading today's code hands the reader evidence that
      contradicts the payload. A live run reads, because there the code and the failure agree.

Measured on the corpus, one run each, all blind:

| Model                         | Reasoning | Score  |
| ----------------------------- | --------- | ------ |
| codex default (`gpt-6-astra`) | none      | 4 of 6 |
| `gpt-5-mini`                  | medium    | 3 of 6 |
| `gpt-5-mini`                  | high      | 3 of 6 |
| `gpt-5`                       | medium    | 3 of 6 |

That table is void, and it took printing codex's own transcript to see why. codex 0.157.1 carries
model metadata for its default alone: every other id, `gpt-5`, `gpt-5-codex`, `gpt-5-mini`,
`o4-mini`, warns `Model metadata not found. Defaulting to fallback metadata; this can degrade
performance`. Version 0.159.0 behaves the same. So three of the four rows ran degraded and the
fourth did not, which is not a comparison of models at all.

It will not be re-measured, because the only id with metadata is the frontier one and running the
corpus on it repeatedly is the cost this change exists to avoid. `gpt-5-mini` is pinned knowing it
falls back: it answered the live failure correctly at high confidence, and the alternative is paying
frontier prices on every red run to classify six buckets.

What the corpus does separate is blind from reading. The live failure of task 4.3 - an inverted
assertion, whose payload is a bare `Expected: false Received: true` - was answered nine times as
`unknown` at low confidence while blind, and once as `unknown` at high confidence naming
`login.steps.ts:13` and the fix once the reader could open the file. That is the change worth
having, and it is free.

Three of the six misses are the same three every time, and each is a known limit rather than a
wrong answer: `application-swallowed-error` answers `timing` because a swallowed 4xx surfaces as a
timeout and the payload cannot show the swallow; `data-wrong-seeded-issue` cannot be answered by
anyone, since `expect(await ...hasCard(title)).toBe(true)` discards both the card seen and the card
wanted before it fails; and `unknown-truncated-artifacts` is the one real regression, because the
smaller model forces a category where the default one abstained.

- [x] 6.3 Print codex's transcript to the step log. It names every file it opens as it opens them,
      and that is the only evidence separating an answer that was read from one that was guessed.
      It is also what found 6.1's confound: the fallback warning was on stdout all along, thrown
      away with it.

## 7. Read the code in Node, not in the model

- [x] 7.1 The script reads the lines around every frame the failure names and puts them in the
      payload, marked at the failing one. The model opens nothing.

Asking the model to open the file worked on a laptop and did not work on CI: the same failure was
answered `unknown`/high naming the inverted assertion locally, and `data`/medium then
`environment`/medium on CI, both phrased as instructions to go and look. codex's transcript shows
the reads happening locally and not there, which points at its sandbox inside the job's container.
Chasing that would have made the answer depend on a permission model that differs per runner.

Reading in Node removes the question. It is the same everywhere, it costs one round trip instead of
several, the payload shows exactly what was given, and the step needs no sandbox at all. `environment`
misclassified is also how an issue went unfiled: `environment` is the one category never filed, so a
wrong answer upstream silently cost the report.

- [x] 7.2 The paragraph describing `sources` is written only when there are sources. A replayed
      corpus payload has none, and telling a reader to consult a field that is not there cost two
      cases: 2 of 6 with the sentence always present, 4 of 6 once it is conditional.

That 4 of 6 is `gpt-5-mini` on fallback metadata, matching what the frontier default scored, and it
now includes `data-wrong-seeded-issue`, recorded earlier as unanswerable by anyone. The two it still
misses are the swallowed 4xx that surfaces as a timeout, and the truncated payload it categorises
instead of abstaining.

4.3 took four runs and each one paid for itself. The first rendered nine identical rows, which is
how the retries turned out to be explained one by one. The second and third answered the same
failure two different wrong ways, which is how codex's silent sandbox failure was found. The fourth
answered it the way the laptop had: `unknown` at high confidence, naming the inverted assertion and
its line, then opened an issue for it.

The board race of `migrate-project-board-to-bdd` reproduced twice on its own while this was being
verified, on edge both times, and was classified `timing` at high confidence with the three frames
of the call traced. It is issue #149, filed by the step rather than by a person.
