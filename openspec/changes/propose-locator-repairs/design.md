# Design

## Why this agent gets tools when the explainer was denied them

`explain-ct-failures` argued that a failure is fully described by its artifacts, so the model was
given a payload on stdin and nothing else. That argument does not carry here. The explainer answers
what broke; this one has to answer what the page says _now_, and no artifact holds that. The trace's
snapshot holds the DOM at the moment of failure, which is the page as the broken locator found it —
useful for confirming the miss, useless for finding the element that replaced it by role and
accessible name.

So the page has to be opened. That fixes where this runs: in the job, after the suite, before
teardown. The application under test is a service container of that job and dies with it, which is a
harder constraint than the explainer's (its raw results merely happened not to be uploaded).

## MCP, and the tool that must not be reachable

`#129` measured `codex exec` against the Playwright MCP server over seven runs on codex-cli 0.157.1:
tool calls succeed with stdin closed and the sandbox on, provided the server carries
`default_tools_approval_mode = "approve"`. `auto`, `prompt`, `writes` and unset all fail with
`MCP tool call requires approval, but approval policy is never`.

The setting is per server and pre-approves every tool that server exposes, so `enabled_tools` is
pinned to what the healer needs: a starting state to open a page, navigation, the snapshot, the
locator generator, and `browser_evaluate` to read the DOM.

`browser_evaluate` was excluded at first and had to come back, which is worth recording because the
reason is the design rather than the tool. `browser_snapshot` returns the accessibility tree — roles
and accessible names, no attributes — and these page objects address the browser with CSS strings.
An agent given the snapshot alone is asked for a class name by an instrument that never shows one,
and two runs proved it: both read the page honestly and both answered with the shape of the tree,
`.state` and then `main h1 + div > :first-child`. So the agent finds the element by role and name,
and then reads its classes.

What the pin is worth is smaller than it first looked, and stating that is part of the design. The
agent holds a full shell under `danger-full-access` and can reach the same instance through it, so
the enumeration does not contain it. What does is that the diff is confined to a locators object,
that nothing is committed, and that the application under test is created for this job and destroyed
with it. `browser_run_code_unsafe` stays off the pin because it runs outside the page under test,
which is a different blast radius, and `#129` named it for that reason.

## Why passing is necessary and not sufficient

An agent allowed to iterate until the test is green will get it green. It can widen a selector until
it matches something, retarget the step at a different element that happens to satisfy the
assertion, or weaken the assertion itself. The healer agent this repository already carries for
local use is explicitly told to mark a test `test.fixme()` when it cannot fix it, which is a green
job and a deleted test. That behaviour must not reach CI.

Three gates, all mechanical, all checked after the agent has finished rather than trusted from it:

1. The scenario that failed passes on the browser it failed on.
2. `git diff` touches nothing outside a `locators` object of a page object. Any other hunk rejects
   the proposal whole, including a change to a step definition, a feature or an assertion.
3. The suite still passes on that browser. This is the gate that catches a repair to a fragment
   shared by several pages, which is how `specific-team.fragment.ts` would have been mended into
   passing one scenario and breaking another.

Failing any of them restores the working tree and leaves the run with its explanation, which is the
state it would have been in had this step not existed.

## Why the proposal is read rather than pushed

`#131` asks for a pull request. Opening one requires `write:repository` on the instance that holds
this code, where the pipeline today holds `write:issue` and nothing more — `ct-functional.yml` says
so in the comment on the step that files an issue. That grant buys the reviewer nothing the step
summary does not already give them: the file, the key, both selectors, and the evidence. It is the
cheaper half of the issue, and the half that can be widened later if reading it in the run turns out
not to be enough.

## How it is known to work

A corpus of locators drifted on purpose, scored the way `explain:score` scores the classifier, with
two numbers rather than one: how often it names the locator a person would have changed, and how
often it stayed inside the `locators` object while doing it. The second measures that it did not
cheat, and a run that scores well on the first alone has not passed.

The corpus carries at least one entry that cannot be repaired — a feature broken in its own logic,
classified `locator` or not — because a healer that never declines is a healer that fabricates.
