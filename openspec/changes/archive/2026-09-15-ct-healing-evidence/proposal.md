## Why

The `pipeline` spec requires every suite to reach the browser through the healing proxy, and `ct.yml` has run with `HEAL_ENABLED: "false"` since `54209b5` because healing broke the suite. The cause was the store's `FIND_ELEMENTS_AUTO_HEALING=true`: it heals on every `findElements` call and appends the healed node to the list, so the framework's polling wait saw its own empty polls "healed" with last run's element. The store now runs with it off (`automindai-infra` f3849d2). The pipeline can return to its spec, and each run now has to say what the proxy did.

## What Changes

- `hlm-proxy` in `ct.yml` runs with `HEAL_ENABLED: "true"` again and `HLM_LOG_LEVEL: debug` (the proxy's own default).
- The `hlm-proxy` comment keeps the cause and drops the measurement narrative.
- After the suite, passed or not, the job collects for every browser session it opened the proxy's log lines for that session (`GET /hlm-proxy/logs/session/{id}`) and the heals recorded against it (`GET /healenium/report/data/{id}`), both through `SELENIUM_REMOTE_URL`. The files land under the suite's `reports/healenium/` and travel in the suite's existing artifact.
- The job log gets a per-session summary: heal count, and per heal the failed locator, the healed locator and its score. No session or no heal is printed as a fact.
- Sessions come from the reports the store opened since the suite started (`GET /healenium/report/all?startDate=`), with the boundary in the store's zone, `America/Bogota`.

### Out of scope

- Any change in `core/`. The base component resolves everything with `findElements`, so with the plural off Healenium records baselines but heals nothing for this framework. A heal-aware wait is the next change, once this one shows the proxy no longer breaks the suite.
- Bumping Healenium's images: `hlm-backend:3.5.1` and `hlm-proxy:2.2.1` are the pair upstream ships together, and 2.2.1 already serves the log endpoint.
- `bs.yml` and `ci.yml`: neither goes through the proxy.
- Purging the store's baselines: they came from real lookups and are inert with the plural off.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pipeline`: gains the requirement that a run publishes, per browser session, what the healing proxy logged and what it healed.

## Impact

`.gitea/workflows/ct.yml` only. The suite will run slower than with the proxy bypassed: every successful lookup now computes node paths in the browser and posts them to the store synchronously. That is the price of recording baselines.
