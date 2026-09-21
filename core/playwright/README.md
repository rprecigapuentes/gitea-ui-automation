# @gitea-automation/core-playwright

Playwright-only helpers that sit outside the page-object layer. Everything in `core/page-objects/` exists so one page object runs against Selenium or Playwright; what lives here has no Selenium equivalent, so it stays out of that abstraction rather than adding a method one strategy could not honour.

## Structure

```
core/playwright/
└── visual-tester/
    └── visual-tester.ts   # VisualTester: verifyPage / verifyComponent screenshot checks
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

## Imports

```ts
import { VisualTester } from "@gitea-automation/core-playwright/visual-tester/visual-tester";
```

The package's `exports` map is `"./*": "./*.ts"`, and the `*` matches sub-folders, so `visual-tester/visual-tester` needs no entry of its own.
