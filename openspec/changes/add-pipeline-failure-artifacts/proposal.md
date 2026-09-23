## Why

A failing run publishes a report and nothing to watch. Playwright records a video and a trace, but no project asks for a video, the functional jobs never upload the directory the two land in, and the visual project asks for a trace it can never produce: it sets `retries: 0` and inherits `trace: "on-first-retry"`, and without a retry there is no first retry, so a visual mismatch leaves no trace at all. Separately, only the vitest suite emits `junit.xml`, so there is no one machine-readable result format across the functional suites.

## What Changes

- The functional Playwright projects record a video on the first retry, the mode their trace already uses, so a green run pays nothing.
- The visual project records a trace on failure, the mode its sibling non-functional projects already use, because it takes no retry.
- The functional jobs upload the output directory that holds the trace and the video.
- The Cucumber and Playwright functional suites emit `junit.xml` beside their Allure results, which vitest already does.
- Performance keeps `trace: "off"` and takes no video: recording changes what a measurement measures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pipeline`: `Each suite publishes its own report` gains the requirement that a functional suite also publishes a machine-readable result file and, when a test fails, the recording and the trace of that failure.

## Impact

`services/playwright-native/playwright.config.ts`, `services/gitea-selenium-cucumber`'s formatter configuration, and the upload steps of the functional jobs. No spec, page object or fixture changes. The non-functional workflows keep the artifacts they already publish.

## Out of Scope

- Any video or trace for the accessibility, visual and performance suites beyond the visual trace fix. An accessibility failure is a text diff on a closed page and a visual failure already publishes expected, actual and diff.
- Reading `junit.xml`. The execution trend that consumes it is a separate piece of work.
- Allure's history directory: the trend is not built from it.
- Moving jobs between workflows, which is `split-continuous-testing-by-suite-kind`.
