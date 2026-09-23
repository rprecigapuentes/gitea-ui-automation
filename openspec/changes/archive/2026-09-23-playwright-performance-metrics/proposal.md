# Proposal

## Why

Performance is a third non-functional area, beyond the two the module requires, and nothing in the framework records how long a page takes to arrive or what it weighs. It is kept deliberately small: client-side timings read from the flows the suite already automates, reusing the project layout, the session and the workflow shape accessibility and visual established.

## What Changes

- Add a performance fixture, handed the page as the scanner is, reading `PerformanceNavigationTiming`, the paint entries and the resource entries. A spec navigates through its page object and asserts; the collection never sits in the spec.
- Read Chrome DevTools Protocol counters (`Performance.getMetrics`) from a session on the same page, so a slow page is explained by script, layout and style time rather than only measured.
- Record a HAR per test through the `recordHar` context option with `content: "omit"`: the status codes, the cache and compression headers and the waterfall the resource entries cannot report, without the response bodies.
- Load each page several times and report the median with its spread, keeping a cold context and a warm reload as two numbers. One measurement on a shared runner carries more variance than the regression it would detect.
- Give the area one project, `performance-chromium`, on `tests/non-functional/performance/`, with one worker, no retries and tracing off: a retry republishes a warm number as a cold one, and a trace charges the measurement for its own overhead. Chromium alone, because the protocol exists on no other engine.
- Write the metrics to `reports/performance/` as JSON per page, and decide the outcome against a baseline committed under the suite that states tolerances rather than exact figures.
- Summarise a run as one self-contained page, reading the figures for the table and the recording for what the timings cannot report: the responses shipped without compression, those that never completed, and what the application asks the browser to cache.
- Add `test:perf` with its `pretest:perf` cleanup, `report:perf`, and `.gitea/workflows/performance.yml`, dispatched by hand like the other two.

## Capabilities

### New Capabilities

- `performance`: what a measurement collects, how it is taken so two runs are comparable, what decides its outcome and what evidence it leaves behind.

### Modified Capabilities

- `pipeline`: adds the requirements of a measuring workflow, which runs alone on its runner and publishes its metrics and its network recording whether it passed or failed.

## Impact

- `services/playwright-native/` (fixture, config, specs, baseline, `package.json`), `.gitea/workflows/performance.yml`, both READMEs.

## Out of Scope

- Load testing: Gitea runs beside the runner, so it would measure the runner.
- Lighthouse: its score moves with runner noise, and its accessibility audit is the axe run already published.
- `performance.mark` around interactions, which would reach into the page objects; drag-and-drop is therefore not measured.
- Wiring into `ct.yml`, which is Gitea issue 108, and any threshold that gates a merge.
