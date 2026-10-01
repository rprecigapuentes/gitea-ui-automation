import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";

// Runs the test command, then builds and opens the Allure report. The script exits with the tests'
// own status, so a report that opens fine never turns a red run green.

const command = process.argv.slice(2).join(" ");

const run = (line) => spawnSync(line, { stdio: "inherit", shell: true });

rmSync("allure-results", { recursive: true, force: true });

const { status } = run(command);

/* CI generates and uploads the report in its own steps, and `allure open` never returns. */
if (!(process.env.CI || process.env.GITHUB_ACTIONS) && run("npm run report").status === 0) {
  /* Ctrl+C closes the served report, not this script, so the tests' exit code survives it. */
  process.on("SIGINT", () => {});
  run("npm run report:open");
}

process.exit(status ?? 1);
