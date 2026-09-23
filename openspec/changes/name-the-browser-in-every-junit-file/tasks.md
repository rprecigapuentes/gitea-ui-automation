## 1. Move the vitest suite's parallelism from workers to processes

- [x] 1.1 Point `test` at `test:parallel` in `services/gitea-selenium-vitest/package.json`, as the Cucumber suite's `test` already is, and verify `pretest` still runs so `allure-results` is cleared once before the three processes write into it.
- [x] 1.2 Drop the default in `maxWorkers: Number(process.env.MAX_WORKERS ?? 3)` to one in `services/gitea-selenium-vitest/vitest.config.ts`, and verify three browsers still run at once, now as three processes of one worker rather than one process of three.
- [x] 1.3 Set `MAX_WORKERS` to `"1"` in the `selenium` job of `.gitea/workflows/ct-functional.yml`, and verify the count matches the Selenium grid's `SE_NODE_MAX_SESSIONS`.

## 2. Confirm it on the runner

- [x] 2.1 Add the temporary on-push trigger to `.gitea/workflows/ct-functional.yml`, push, and verify the `selenium` job ends green.
- [ ] 2.2 Verify `allure-report-gitea-selenium-vitest` now carries `junit-chrome.xml`, `junit-firefox.xml` and `junit-edge.xml` instead of one `junit.xml`.
- [ ] 2.3 Compare the `selenium` job's duration against run #514's, and record it: three browsers still run at once, so a suite that got slower means the workers were doing something the processes are not.
- [ ] 2.4 Remove the temporary trigger in its own commit, and verify that commit touches only the workflow.

## 3. Document the entry point

- [x] 3.1 Update the root `README.md` where it describes `npm test` as a single Vitest run and `test:parallel` as the mode that gives one JUnit report per browser; verify the two rows no longer contradict each other.
- [x] 3.2 Run the three gates, `npm run format`, `npm run lint` and `npm run typecheck`, and verify all three pass.
