## Why

The three functional suites now write junit, but only two of them say which browser produced a result. Cucumber writes one file per browser process and Playwright stamps the project on every `testsuite`; the vitest suite runs its three browsers as projects of one process, and its junit reporter names a `testsuite` after the file alone. Three identical entries come out, one per browser, with nothing to tell them apart. A trend that reads these files can report the suite's pass rate but not a browser's, and a browser that is failing on its own is invisible.

## What Changes

- The vitest suite's `test` entry point runs one process per browser, as the Cucumber suite's already does, so each writes the `junit-<browser>.xml` the config already resolves.
- Its default worker count drops to one, because the parallelism moves from workers inside a process to the processes themselves. Three browsers still run at once, which is what the pipeline's Selenium grid is sized for.
- The pipeline asks for one worker per process rather than three.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pipeline`: `Each suite publishes its own report` gains the requirement that a result file names the browser that produced it.

## Impact

`services/gitea-selenium-vitest/package.json`, `services/gitea-selenium-vitest/vitest.config.ts`, `.gitea/workflows/ct-functional.yml` and the root `README.md`. No test, fixture or page-object changes. The number of browsers running at once is unchanged, so the suite's duration should be too, which the pipeline confirms.

## Out of Scope

- Reading the junit files. The execution trend that consumes them is separate work.
- The Cucumber and Playwright suites, which already name the browser.
- `test:serial` and the BrowserStack scripts, which keep running as they do.
- Making the three suites agree on one file-per-browser shape: Playwright's single file names the browser on each entry, which is enough for a reader.
