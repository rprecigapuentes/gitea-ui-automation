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

`snapshotPathTemplate` is `{testDir}/baselines/{projectName}/{arg}{ext}`. Screenshots are pixel-exact per browser and platform, so unlike the accessibility baselines they cannot be shared across projects. One project exists per browser of the functional list (`visual-chrome`, `visual-firefox`, `visual-edge`), each with its own baselines.

## Cross-browser and parallel

The projects are derived from the `browsers` list `playwright.config.ts` already builds the functional projects from, so adding a browser there adds its visual project. Chromium stays with the accessibility scans, where axe reads the DOM and one engine is enough; screenshots depend on the rendering engine, so the visual suite runs on the three engines the functional suite does.

The functional suite reaches parallelism by launching one process per browser with `concurrently`, one worker each. That does not fit the native HTML report: every process writes to the same `playwright-report/` folder, so the last one to finish overwrites the others. The visual suite instead runs all its projects in one process with `fullyParallel` and the default worker count, which parallelises across browsers and specs and leaves one report. Two browsers never share a Gitea account, since each project signs in with `GITEA_OWNER_<BROWSER>`, so the projects do not interfere.

The name passed to a check carries its extension (`login-page.png`). Playwright numbers unnamed screenshots per test, which would rename a baseline whenever a check is added before it.

## Credentials for the bundled Chromium

Accounts are resolved from the project-name suffix, and the environment holds `CHROME`, `FIREFOX` and `EDGE` only. `browserOf` maps `chromium` to `chrome`. This also reaches the `accessibility-chromium` projects, which resolve through the same function.

## Risks / Trade-offs

- [The Gitea footer prints `Page: Nms Template: Nms`, which changes on every load, so a full-page screenshot of any page differs between runs] → tracked as its own task; masking is the argument this change deliberately does not add yet.
- [Three baselines per page, and Firefox and Edge render text and the footer differently from Chrome] → each project records and compares only its own; a new spec costs three recordings.
- [Baselines recorded on Windows differ from those a Linux runner renders] → no CI workflow is added here; when one is, its baselines are recorded there.
- [`verifyComponent` takes a `Locator`, and a spec that builds one with `page.locator` breaks the rule that a test reaches the browser through a page object] → no spec uses it yet; the first that does decides whether the page object exposes the locator.

## Open Questions

- Whether `verifyComponent` should take a selector resolved against the page instead of a `Locator`, to keep specs off `page.locator`.
