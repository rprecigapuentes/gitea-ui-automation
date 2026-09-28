# @gitea-automation/core-playwright

Playwright-only helpers that sit outside the page-object layer. Everything in `core/page-objects/` exists so one page object runs against Selenium or Playwright; what lives here has no Selenium equivalent, so it stays out of that abstraction rather than adding a method one strategy could not honour.

Nothing here knows what Gitea is. The shared Playwright fixtures used to live in this package and no longer do: they compose page objects and API clients, which is domain knowledge, and a package of `core/` that imports `business-logic` points its dependency at the layer above it. They are test-layer code and now live in [`services/_shared/playwright`](../../services/_shared/playwright/README.md).

## Structure

```
core/playwright/
├── visual-tester/
│   └── visual-tester.ts             # VisualTester: verifyPage / verifyComponent screenshot checks
└── performance-collector/
    └── performance-collector.ts     # PerformanceCollector: navigation, paint, resource and engine figures
```

## VisualTester

```ts
const visualTester = new VisualTester(["footer"]); // regions masked in every check

await visualTester.verifyPage(page, "issue-list.png", { mask: ["relative-time"] });
await visualTester.verifyComponent(locator, "issue-row.png");
```

- `verifyPage(page, name, { mask })` and `verifyComponent(locator, name, { mask })` compare with `expect.soft(...).toHaveScreenshot(name, ...)`. They are soft: a mismatch is recorded, the test carries on, and it fails when it ends.
- The constructor takes the selectors masked in every check; `mask` adds the ones of one check. Selectors are plain strings resolved against the page, so a spec never builds a `Locator` for them. `verifyComponent` reaches the page through `locator.page()`.
- `name` is the baseline's file name, extension included. Where it is stored depends on the `snapshotPathTemplate` of the Playwright project running the test; see [`services/playwright-native`](../../services/playwright-native/README.md#visual-testing).
- `expect` finds the running test on its own, so nothing needs the test's `testInfo`.

`services/playwright-native` builds one in `fixtures/visual.fixture.ts` and exposes it as the `visualTester` fixture; the specs never construct it.

## PerformanceCollector

```ts
const collector = new PerformanceCollector(page, cdpSession, 5); // five loads per page

const measurement = await collector.measure("dashboard", () => pageObjects.mainPage.open());
```

- `measure(name, navigate)` takes the navigation as a callback, not a URL. The collector loads the page repeatedly and must not reach past the page object to do it, so the caller hands it the page object's own `open`; every load then waits for that view's ready locators.
- Each load is measured twice, once with the browser cache cleared and once straight after, so `cold` and `warm` stay separate in the result. Every metric comes back as a median with its minimum, maximum and samples.
- The navigation phases, both contentful paints and the resource count and weight are read in the page. The script, layout and style figures come from the CDP session, which is why the collector needs one and why it runs on Chromium alone.
- Those engine counters reset on every navigation rather than accumulating, so the value read after a load describes that document; they arrive in seconds and are converted, since every timing beside them is in milliseconds.
- It writes nothing and asserts nothing. Publishing the figures and judging them against a band belong to the suite; see [`services/playwright-native`](../../services/playwright-native/README.md#performance-metrics).

`services/playwright-native` builds one in `fixtures/performance.fixture.ts` and exposes it as the `performanceCollector` fixture; the specs never construct it.

## Imports

```ts
import { VisualTester } from "@gitea-automation/core-playwright/visual-tester/visual-tester";
import { PerformanceCollector } from "@gitea-automation/core-playwright/performance-collector/performance-collector";
```

The package's `exports` map is `"./*": "./*.ts"`, and the `*` matches sub-folders, so `visual-tester/visual-tester` needs no entry of its own.
