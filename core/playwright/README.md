# @gitea-automation/core-playwright

> Playwright-only tools for the non-functional suites: screenshot comparison and page-load
> measurement.

They live outside `core-page-objects` because Selenium has no equivalent, so they cannot be part of
a contract both tools honour.

## VisualTester

Compares a page, or one element, with a recorded screenshot.

```ts
const visualTester = new VisualTester(["footer"]); // masked in every check

await visualTester.verifyPage(page, "issue-list.png", {
  mask: pageObjects.issueListPage.getVolatileRegions(),
  maxDiffPixels: 2400,
});
await visualTester.verifyComponent(locator, "issue-row.png");
```

- **Soft assertions.** A mismatch is recorded and the test carries on, so one run reports every view
  that changed.
- **Masks** paint over regions whose content changes between runs. The constructor takes the ones
  every check needs; `mask` adds those of one view, usually from the page object's
  `getVolatileRegions()`.
- **`maxDiffPixels`** is a budget per check; omit it for an exact match. Each spec's value was set in
  its own commit, so `git log -S"maxDiffPixels: <n>"` finds the reason behind a number.
- **`name`** is the baseline's file name. Where it is stored depends on the project's
  `snapshotPathTemplate`; see [`playwright-native`](../../services/playwright-native/README.md#visual-testing).

## PerformanceCollector

Loads a page several times and summarises what each load cost.

```ts
const collector = new PerformanceCollector(page, cdpSession, 5); // five loads

const measurement = await collector.measure("dashboard", () => pageObjects.mainPage.open());
```

- **The navigation is a callback**, the page object's own `open`, so every load waits for the same
  ready locators the functional tests wait for.
- **Cold and warm.** Each load runs twice: once with the browser cache cleared, once straight after.
- **Median, minimum, maximum and samples** for every metric: navigation phases, first and largest
  contentful paint, request count and weight, and the engine's script, layout and style time.
- **Chromium only**, because the engine counters come from the DevTools protocol.
- It asserts nothing and writes nothing; the suite publishes and judges the figures.
