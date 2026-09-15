## Why

CT run #317, the first through the healing proxy since the store stopped healing the plural, failed three tests with no heal recorded. The proxy's per-session log explains each one: two lookups sent at the same moment on one session, one of them answered with an empty list while the other found the element, and the same locator found again 250 ms later. hlm-proxy handles concurrent commands on one session with a single mutable processor chain (`BaseHandler.findElementsChainProcessor`, `setContext` before `process`), so the second lookup overwrites the first's context and the first returns nothing. Selenium alone never showed this because it serializes commands per session; the proxy does not.

The framework issues concurrent lookups by design: `isVisible` over several locators, `actAndWaitFor`, `reload`, and page checks built on `Promise.all`. Every one of them is a coin toss through the proxy.

## What Changes

- The base component sends one lookup at a time per driver. `findElements`, the only place the framework calls `findElements` on the driver or on an element, queues that call behind the previous one on the same driver. Only the driver call is queued, not the wait around it, so concurrent waits still interleave their polls.
- Nothing above the base component changes: pages keep their `Promise.all`, and the concurrency they express is still real for everything that is not a lookup (reading text or attributes of resolved elements goes through the proxy's passthrough route and is unaffected).

### Out of scope

- The healing-aware wait (a singular lookup once the poll gives up). Still the next change.
- Serializing anything other than lookups. `isDisplayed`, `getText`, `getAttribute` and clicks are not routed through the proxy's healing handler.
- The `ct-healing-evidence` change, which this one exists to make green.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `core-driver`: gains the requirement that the base component resolves locators one at a time per browser session, whatever concurrency its callers express.

## Impact

`core/selenium/ui/base-pages/base-component.ts` only. Every page gains it. A lookup through the proxy costs about 30 ms; with N concurrent lookups the last waits N times that, which is below the 200 ms poll interval of the waits around them.
