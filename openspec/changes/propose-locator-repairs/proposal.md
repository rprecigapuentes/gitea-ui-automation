# Proposal

## Why

Since `explain-ct-failures`, a red run says which test failed and what kind of failure it was. When
the answer is `locator`, what follows is always the same and always by hand: find the page object
that owns the selector, open the page, see what it became, change one string. The run could have
done it while its own Gitea was still up, and instead throws that instance away.

Healenium was rejected in week 2 for doing this inside the execution path, rewriting locators
mid-test and corrupting the test's own logic. The requirement that came out of it still stands — a
locator matching nothing fails its test, and no substitute is resolved on its behalf. This runs
after the suite has finished, and leaves the test red.

## What Changes

- `services/playwright-bdd/scripts/heal-locators.mjs`, a step after `explain` in the job that
  already runs. It reads `reports/explanation.json`, keeps what was classified `locator` above low
  confidence, and exits when there is none.
- The failing selector is traced to its page object by search rather than by a model: these are
  string literals in a `locators` object, so the file, the line and the key are a grep.
- The agent is handed the live page through the Playwright MCP server, which `#129` measured as
  callable with stdin closed and the sandbox on. It collects candidates by role and accessible name,
  applies one, and re-runs the single scenario that failed.
- A repair is proposed only when that re-run passes, the diff touches nothing outside a `locators`
  object, and the suite still passes on the browser that failed. Otherwise the working tree is
  restored and the run explains the failure only.
- The proposal is a row in the run's step summary: the file, the key, the old and new selector, why,
  and what was re-run to prove it.

## Capabilities

### Modified Capabilities

- `pipeline`: a failing functional run proposes the locator to change, having verified it.

## Impact

- New: `heal-locators.mjs`, its MCP configuration, and a corpus of drifted locators to score it.
- Modified: `services/playwright-bdd/package.json`, `.gitea/workflows/ct-functional.yml`, `.mcp.json`.

Out of scope: opening a pull request, which `#131` asks for. Nothing is pushed, so the job's token
keeps `write:issue` and the pipeline still cannot reach the code. Applying or committing a repair.
The other three suites. Any failure that is not a locator.
