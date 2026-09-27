## Context

See proposal.md - Why. What shapes the approach is how the Playwright test MCP server resolves and
runs a starting state, which is not configurable and had to be read from the installed package:

- `generator_setup_page` and `planner_setup_page` take an optional `seedFile`, resolved against the
  project's `testDir`, the config directory and the repository root
  (`playwright/lib/mcp/test/testContext.js:136-140`). A plan records `**Seed:** <path>` per suite
  (`plannerTools.js:115`), and the generator passes it back. More than one starting state is
  therefore already supported; nothing has to be invented for it.
- When no path is passed, the server takes the first collected file whose basename contains `seed`
  (`seed.js:52`), and when it finds none it **writes an empty one** at `<testDir>/seed.spec.ts`
  (`seed.js:65`). That is the failure mode to design against: a silent return to the state this
  change removes.
- The starting state runs through the ordinary runner with a location filter and `pauseAtEnd: true`
  (`testContext.js:160-169`), so the test body executes, the run pauses before teardown, and the
  fixtures are still alive while the agent drives the browser.
- With no project named, the server uses the first top-level project in the config
  (`runner/index.js:2210`).

Two constraints come from this repository. `browserOf` in
`services/playwright-native/fixtures/credentials.ts` reads the account suffix from the text after
the last `-` in the project name. And every script and workflow names its projects explicitly
(`npm test` runs `--project=chrome --project=firefox --project=edge`, and
`.gitea/workflows/ct-functional.yml` calls that script), so a project nobody names never runs.

## Goals / Non-Goals

**Goals:**

- The starting states are unmistakably not suite tests, by location and by which project collects them.
- An agent that names nothing still gets the right browser, rather than a newly written empty file.
- The exclusion from the suites does not make the starting states unreachable to the agents.

**Non-Goals:**

- Starting states for Firefox and Edge. The agents explore on one browser; what they emit runs on
  all three through the ordinary projects.
- Any change to how the suites themselves seed, log in or clean up. The starting states reuse those
  fixtures unchanged.

## Decisions

**A directory of its own, `services/playwright-native/tests/seeds/`.** The suites' own `testDir` is
`./tests`, which recurses, so a directory alone excludes nothing - it only makes the intent
readable. The exclusion is the next two decisions.

**A project of its own, `seeds-chrome`, with `testDir: ./tests/seeds`, listed first.** Listing it
first makes it the first top-level project, which is what the server picks when an agent names no
project. Its own `testDir` keeps its collection independent of what the browser projects ignore.
The suffix `-chrome` is not cosmetic: `browserOf` would read `AGENT` from a name like `seed-agent`
and fail to resolve `GITEA_OWNER_AGENT`. Alternative rejected: reusing the `chrome` project and
excluding the directory there, which is the next decision's failure mode.

**`testIgnore` on the browser and non-functional projects, never as the only mechanism.** Alone it
is worse than nothing: the server runs the starting state through the same runner, an ignored file
is never collected, and the run fails with "seed test not found" - or, when no path was named,
silently writes the empty `tests/seed.spec.ts` again. It works only paired with the project above,
which collects the directory the others ignore.

**Alternatives rejected for the exclusion.** `test.skip(!!process.env.CI)` leaves the starting
states running locally, creating and deleting a repository on every developer run, and leaves them
visible as skipped rows in the report. Tagging them and adding `--grep-invert` touches eight npm
scripts and silently stops working the day someone adds a ninth.

**Two files: `seeds/seed.spec.ts` (signed in, inside a fixture repository) and
`seeds/anonymous.spec.ts` (signed out).** Only the first matches `includes("seed")`, and the search
now runs inside `tests/seeds` alone, so the default is deterministic rather than dependent on
directory order. A plan that needs the signed-out browser names the second by path.

**The signed-in starting state stops at the dashboard.** No page object owns a repository's own
page today - `business-logic/pages/repositories/` holds only `create-repository.page.ts` - and
adding one to navigate a starting state would be scope this change does not need. The state the
agent is handed is the session and the repository the fixtures created; it reaches that repository
through the page object that owns the page its scenario targets, such as
`createIssuePage.openFor(owner, repository)`.

**The generator's rule stays a pointer, as the rest of that section already is.** It states that
fixture-owned values are read from the fixtures the starting state declares. The starting state
makes the correct state real; the rule decides the shape of what is emitted. Neither replaces the
other: explored inside a fixture repository and left without the rule, the generator would hardcode
that repository's generated name, which is worse than the current literal because it never exists
twice.

## Risks / Trade-offs

**`npx playwright init-agents` rewrites the agent definitions and can write a fresh
`tests/seed.spec.ts`** → The repository already re-applies its own section of those files after an
upgrade; this change adds the starting states to that list. The wiki page that documents the agents
is updated separately, since the wiki is a different repository.

**A future `playwright test` with no `--project` would run the starting states** → Every script and
workflow names its projects today. The seeds project creates and removes its own state, so the cost
of the mistake is a wasted repository, not a corrupted run.

**An agent can still pass `project` explicitly and land in the wrong one** → The failure is loud:
the starting state is not collected there, and the server reports that it found no seed test.
