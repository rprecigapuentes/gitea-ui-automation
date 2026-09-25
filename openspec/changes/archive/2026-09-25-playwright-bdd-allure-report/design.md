## Context

The test scripts chain several commands, and two of them run three processes through `concurrently`. The report has to be built after all of them, even when the tests fail, without losing the tests' exit code. The Cucumber service chains with `&`, which behaves differently in each shell; the repository is developed on Windows and run on Linux CI.

## Decisions

- **A Node wrapper, not shell chaining.** `scripts/run-with-report.mjs` takes the command to run, spawns it through the shell, then generates and opens the report, and exits with the command's code. `&&`, `||` and `;` mean different things on `cmd.exe` and `sh`, and `npm`'s `post<script>` hook does not run when the tests fail, which is when the report matters most.
- **The wrapper clears `allure-results`**, as `playwright-native` does in `pretest`, so a report never mixes two runs. It lives in the wrapper rather than in `pre<script>` hooks so every test script gets it.
- **`bddgen` stays outside the wrapper**, so a generation error stops before any report is attempted.
- **CI skips the report.** The pipeline runs `npm run report` and uploads the result in its own steps, and `allure open` serves the report and does not return.
- **Same versions as `playwright-native`** for `allure` and `allure-playwright`, so the lockfile keeps one copy of each.
