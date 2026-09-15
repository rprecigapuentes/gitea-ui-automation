## 1. Route the suites through healing again

- [x] 1.1 In `ct.yml`'s `hlm-proxy` service set `HEAL_ENABLED: "true"` and `HLM_LOG_LEVEL: debug`, and replace the three-run measurement comment with the cause (the store healed the plural on every call; off since `automindai-infra` f3849d2) in two or three lines, moving the measurements to the commit body. Verify with `npm run format:check` and by reading the rendered block back: no sentence about score caps or run counts remains in the YAML.

## 2. Publish the proxy log and the heals of every session

- [x] 2.1 Add a step before `Run the suite` that exports `SUITE_STARTED_AT` to `$GITHUB_ENV` as an ISO date-time computed with `TZ=America/Bogota`, one minute in the past to absorb clock skew. Verify in the step log that the value prints in that zone.
- [x] 2.2 Add a step after `Run the suite`, `if: always()` and `continue-on-error: true`, that calls `GET $SELENIUM_REMOTE_URL/healenium/report/all?startDate=$SUITE_STARTED_AT`, and for each returned `id` writes `GET $SELENIUM_REMOTE_URL/hlm-proxy/logs/session/$id` to `services/<suite>/reports/healenium/$id.logs.json` and `GET $SELENIUM_REMOTE_URL/healenium/report/data/$id` to `services/<suite>/reports/healenium/$id.heals.json`. Print per session the heal count and, per heal, `failedLocatorValue -> healedLocatorValue (score)`; print `no session was opened through the proxy` when the list is empty; print which session's request failed when a call does not answer. Verify by dispatching CT with `suite=gitea-selenium-vitest` and reading three session summaries in the step log, one per browser.
- [x] 2.3 Add `services/${{ matrix.suite }}/reports/healenium/` to the `Upload the report` path. Verify on the same dispatch that the artifact contains one `*.logs.json` and one `*.heals.json` per session, and that `*.logs.json` carries `Find Elements Request` lines and `[Save Elements]` entries in `backendLogs`.

## 3. Confirm the pipeline holds with healing on

- [x] 3.1 Dispatch CT once per suite with the store already on `FIND_ELEMENTS_AUTO_HEALING=false`. Verify every `*.heals.json` has an empty `data` array, the summaries print zero heals, and the suites pass as they did with the proxy bypassed. A non-empty `data` means the store is still healing the plural: stop and check the deploy before anything else.
- [x] 3.2 Dispatch each suite a second time and record its duration in the commit body of the archive commit, next to the 134s measured with the proxy bypassed. Verify `npm run format`, `npm run lint` and `npm run typecheck` are clean before the final commit.

## 4. What the two runs showed

- [x] 4.1 Run #317 (healing on, store no longer healing the plural): 0 heals in 12 vitest and 14 Cucumber sessions, but 3 failures with no heal behind them. The per-session proxy log showed two lookups on one session answered by two threads, one of them empty. That is hlm-proxy's shared processor chain, fixed on the framework side by `serial-lookups-per-session`.
- [x] 4.2 Run after `daaa550`: vitest 12/12, Cucumber 13/13 on chrome, 0 heals, baselines recorded. From the proxy timestamps, vitest spans 200s (03:52:21 to 03:55:41 UTC) and Cucumber 223s, against 134s for vitest with the proxy bypassed.
