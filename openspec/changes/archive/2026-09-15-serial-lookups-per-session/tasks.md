## 1. Queue lookups per driver in the base component

- [x] 1.1 In `core/selenium/ui/base-pages/base-component.ts`, keep a module-level `WeakMap<WebDriver, Promise<unknown>>` and route the `root.findElements(locator)` call inside `findElements.checkOnce` through it: chain the call behind the driver's current tail, replace the tail with the chained promise made non-rejecting, and leave `isDisplayed`, the wait and everything else outside the queue. Verify with `npm run typecheck` and `npm run lint` clean, and with a local vitest run of `organizations.test.ts` on chrome passing unchanged against the direct Selenium path.

## 2. Confirm through the proxy

- [x] 2.1 Push the branch and let CT run both suites through the proxy. Verify that no session's `*.logs.json` shows two `Find Element Request` lines from different threads inside the same 100 ms, that the vitest suite passes 12/12 and the Cucumber suite has no failure at a login or readiness check, and that every `*.heals.json` still holds an empty `data` array.
