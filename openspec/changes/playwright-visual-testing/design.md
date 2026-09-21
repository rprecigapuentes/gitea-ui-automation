# Design

## Why this artifact exists

The change decides where a screenshot assertion lives and what a mismatch does to a test. Neither is obvious from the code, and the first attempt went the other way, so the reasoning is recorded here.

## Where the check lives

The check is a `VisualTester` class in `core/playwright/visual-tester/`, handed the `Page` or `Locator` by the spec. Three placements were considered.

| Option                                                    | Cost                                                                                                                                            |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| A method on the page objects                              | The page object would need a Playwright `Locator`, which `IElementHandle` deliberately hides                                                    |
| A capability on `IInteractionStrategy` (tried, abandoned) | Selenium has no baseline-managing comparison, so the contract grows a method one strategy cannot honour, plus a type guard to fail at run time  |
| A visual tester outside the page objects                  | The spec passes `page` to it, as it already does to the axe builder; a scanner "is handed the page" is the boundary the project already accepts |

The last is chosen. It keeps `IElementHandle` and the strategy contract untouched, and puts a Playwright-only feature in a Playwright-only place.

`core/playwright` is its own workspace package, `@gitea-automation/core-playwright`, mirroring `core/page-objects`, so a tool-specific helper never lands in a package that also serves Selenium. Its `exports` map is `./*` to `./*.ts`, and the `*` matches sub-folders, so `visual-tester/visual-tester` resolves without a second entry.

## Why a fixture of its own

`visual.fixture.ts` extends the suite fixture, exactly as `axe.fixture.ts` does, and adds `visualTester`. Adding it to `fixture.ts` would put it in every functional test's parameter set for a feature only one directory uses.

## Why the checks are soft

A visual mismatch says the page looks different, not that the flow is broken. With a hard assertion, a cosmetic diff on the login page would hide whether the sign-in that follows still works. `expect.soft` records the mismatch, lets the later steps run, and still fails the test at the end. The cost is that a mismatch which leaves the page in an unexpected state can produce further, unrelated failures in the same report; the first error is the visual one.

## Baselines

`snapshotPathTemplate` is `{testDir}/baselines/{projectName}/{platform}/{arg}{ext}`. Screenshots are pixel-exact per browser and per platform, so unlike the accessibility baselines they cannot be shared across projects, and a baseline recorded on Windows cannot be compared on the workflow's Linux runner. Without the platform in the path the two would overwrite each other's files and each would fail against the other's. One project exists per browser of the functional list (`visual-chrome`, `visual-firefox`, `visual-edge`), each with its own baselines.

## Cross-browser and parallel

The projects are derived from the `browsers` list `playwright.config.ts` already builds the functional projects from, so adding a browser there adds its visual project. Chromium stays with the accessibility scans, where axe reads the DOM and one engine is enough; screenshots depend on the rendering engine, so the visual suite runs on the three engines the functional suite does.

The functional suite reaches parallelism by launching one process per browser with `concurrently`, one worker each. That does not fit the native HTML report: every process writes to the same `playwright-report/` folder, so the last one to finish overwrites the others. The visual suite instead runs all its projects in one process with `fullyParallel` and the default worker count, which parallelises across browsers and specs and leaves one report. Two browsers never share a Gitea account, since each project signs in with `GITEA_OWNER_<BROWSER>`, so the projects do not interfere.

The name passed to a check carries its extension (`login-page.png`). Playwright numbers unnamed screenshots per test, which would rename a baseline whenever a check is added before it.

## Volatile regions

The visual tester is used by every view, not only login, so what varies between runs is split in two. Regions common to the whole application, such as the footer's `Page: Nms Template: Nms`, are a default of the visual tester's fixture. Regions of one view belong to that view's page object, because only it knows the DOM: `BasePage.getVolatileRegions()` returns `string[]`, empty by default, and a page overrides it when a region is identified. The list is plain selectors, so the page object gains no Playwright dependency, and the spec passes it to the check instead of calling `page.locator`. The list starts empty everywhere and grows as runs reveal what varies.

## How a visual spec reaches a state

A visual spec is one test with a checkpoint per view: create through the API, open the view through its page object, compare, and go on. The creation stays in the test body, as `clients.<resource>.create...` calls, so a reader sees what state each view is in without opening a fixture. The page object opens and waits, and the tester only compares, so the tester does not learn URLs or readiness selectors.

Clean-up is the opposite: it belongs in a hook, because it must run when a step fails and asserts nothing. The spec records what it created in `scenarioState` and an automatic fixture in `hooks-fixtures.ts` removes it after the test, the way the Cucumber hooks do. Names are fixed per project (`<prefix>-<project>`), not random, which keeps them out of the screenshot's variance; the hook is what guarantees a rerun finds nothing left behind.

## The visual workflow

`visual.yml` follows `accessibility.yml`: its own workflow, dispatch only, the Playwright container, its own `gitea-test` service, an administrator registered first, artifacts published with `if: always()`. It differs in four ways. It runs three browsers, so it registers three accounts and mints their tokens, and installs the branded Chrome and Edge that the image does not carry, as `ct.yml` does. The native report cannot open itself on a runner, so `test:visual:ci` runs with `PLAYWRIGHT_HTML_OPEN=never` and the workflow uploads `playwright-report/`. A `record_baselines` input switches the run to `test:visual:update` and uploads the recorded baselines, because the ones committed from a workstation do not match the runner. Recording does not commit: a person downloads, looks at, and commits them.

Gitea lists only the default branch's workflows in its Actions menu, so before this merges the workflow carries a temporary `push` trigger on the feature branch, as `accessibility.yml` did. A push records the runner's baselines while none are committed and compares once they are, so the first run needs no input. The trigger is removed before the merge.

It stays manual for now, like accessibility. Nothing gates on it until baselines exist for the runner and the volatile regions have settled; a scheduled run before that would report noise. Promoting it to a scheduled job after the Playwright job in `ct.yml` is a later change.

## Credentials for the bundled Chromium

Accounts are resolved from the project-name suffix, and the environment holds `CHROME`, `FIREFOX` and `EDGE` only. `browserOf` maps `chromium` to `chrome`. This also reaches the `accessibility-chromium` projects, which resolve through the same function.

## Risks / Trade-offs

- [The Gitea footer prints `Page: Nms Template: Nms`, which changes on every load, so a full-page screenshot of any page differs between runs] → tracked as its own task; masking is the argument this change deliberately does not add yet.
- [Three baselines per page, and Firefox and Edge render text and the footer differently from Chrome] → each project records and compares only its own; a new spec costs three recordings.
- [Baselines recorded on Windows differ from those a Linux runner renders] → no CI workflow is added here; when one is, its baselines are recorded there.
- [`verifyComponent` takes a `Locator`, and a spec that builds one with `page.locator` breaks the rule that a test reaches the browser through a page object] → no spec uses it yet; the first that does decides whether the page object exposes the locator.

## Open Questions

- Whether `verifyComponent` should take a selector resolved against the page instead of a `Locator`, to keep specs off `page.locator`.
