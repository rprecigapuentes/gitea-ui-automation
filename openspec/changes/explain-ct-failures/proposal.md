## Why

A red continuous-testing run publishes a 6 MB single-file Allure report and a `junit*.xml`. Reading
it means opening the report, finding the failed test, reading a stack and deciding whether the cause
was the locator, a wait, the data, the environment or the application. Nobody does that at 11am on
the run that failed at 6am.

Everything the decision needs is already written. The suite's raw Allure results name the Gherkin
step that failed, in the words of the feature file; the report that ships today does not — its
`test-results.json` holds `{id, name, duration, status}` and no steps. The material exists and is
thrown away with the runner.

## What Changes

- `services/playwright-bdd/scripts/explain-failures.mjs`, a CLI in the shape of this repository's
  existing `accessibility-summary.mjs`: it reads a directory of raw results and writes a summary
  beside it. Three stages — collect the non-passing results, reduce them, explain them.
- The reduction is the load-bearing part. The worst result file in this repository is 128 KB of
  nested `Wait for selector` and `Click`; reduced to its top-level steps it is 4.4 KB. Over all 204
  result files on disk the factor is 13.3.
- A model is asked one question per failed test, against a JSON schema, and answers with the test,
  the failing step, a category, a confidence, its reasoning and the first thing to check. It is
  given the payload and no tools: explaining a failure is reading artifacts, not browsing.
- `ct-functional.yml` gains one step in the job it already has, conditioned on failure and on the
  BDD suite, before the upload that already runs. The explanation rides in the artifact that is
  already published and is written to the run's step summary.

## Capabilities

### Modified Capabilities

- `pipeline`: a failing functional run publishes a written explanation of what failed.

## Impact

- New: `services/playwright-bdd/scripts/explain-failures.mjs`, its schema, and a corpus of reduced
  payloads from failures this repository has already diagnosed.
- Modified: `services/playwright-bdd/package.json`, `.gitea/workflows/ct-functional.yml`.

Out of scope: the other three suites — extending this is reading another directory, not redesigning
anything. Publishing the explanation as a comment on a Gitea issue, which needs a second secret and
would have the pipeline write to the instance holding the code for the first time. Giving the model
tools so it can explore. Uploading raw results: the explainer runs where they are still on disk.
