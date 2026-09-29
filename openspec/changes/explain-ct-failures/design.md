# Design

## Why the raw results, and not the report that already ships

The explanation has to name the step that failed. Three artifacts were candidates:

| artifact                          | has the failing step                             | published today |
| --------------------------------- | ------------------------------------------------ | --------------- |
| `reports/junit*.xml`              | no — test, message, stack                        | yes             |
| `allure-report/test-results.json` | no — `{id, name, duration, status, environment}` | yes             |
| `allure-results/*-result.json`    | yes, in the words of the feature file            | **no**          |

Only the raw results carry it, and they are the one thing the run throws away. Rather than upload
them — 5.5 MB for a green run of this suite — the explainer runs in the job where they are still on
disk, and what gets published is what it produced.

## The reduction

A raw result is unusable as a prompt. Measured over the 204 result files in this working copy:

|                                              | raw       | reduced | factor |
| -------------------------------------------- | --------- | ------- | ------ |
| worst single file (the organizations `@e2e`) | 128,675 B | 4,462 B | 29     |
| all 204                                      | 5,516 KB  | 416 KB  | 13.3   |

The difference is entirely the nested steps. A single Gherkin step expands into dozens of
`Wait for selector`, `Click` and `Expect "toBe"` entries, which describe how the framework moved,
not what the scenario was doing. The reduction keeps the top-level steps with their status, the
`statusDetails` message and trace bounded to a length, the test's name and the labels that say which
browser and which tags it ran under.

## The failing step is a top-level step, and only a top-level step

A result can carry `status: "passed"` and still contain nested steps with `status: "failed"` — a
`Wait for selector` that expired inside a locator's own retry loop and then succeeded. There are
such results in this repository right now.

So the failing step is the first **top-level** step whose status is not `passed`, and a result that
passed has none. Searching the tree for `failed` finds a step in a test that never failed, and names
an internal wait in a vocabulary the feature file does not use. This is the one rule in the reducer
that is not obvious from the data, and the reason the spec states it.

## Why the model gets no tools

The failure is described by the artifacts; there is nothing to navigate. The payload goes in on
stdin, the JSON comes out against `--output-schema`, and the sandbox is read-only. A model that can
open a browser is a different capability with a different failure mode, and it belongs to the change
that needs one.

## How it is known to work

A corpus of failures this repository has already diagnosed, each stored as the reduced payload it
produces plus the category its own change document assigns. The score is how many of them the
explanation gets right — a number, run again whenever the prompt changes.

One entry is deliberately undiagnosable. Without it every model scores perfectly, because nothing in
the corpus rewards saying `unknown`.
