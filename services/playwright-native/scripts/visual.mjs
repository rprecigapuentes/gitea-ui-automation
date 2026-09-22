import { spawn } from "node:child_process";
import { rmSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import path from "node:path";

/* One process per browser, one worker each: a browser's specs run one after another with its own
   account while the browsers run side by side, as `test:parallel` does for the functional suite.
   Each process writes a blob report, and the blobs are merged into the single native report. */
const browsers = ["chrome", "firefox", "edge"];
const extraArgs = process.argv.slice(2);
const recording = extraArgs.includes("--update-snapshots");
const rawReportDir = "blob-report-raw";
const mergedReportDir = "blob-report";

function run(args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn("npx", args, {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, ...env },
    });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

rmSync(rawReportDir, { recursive: true, force: true });
rmSync(mergedReportDir, { recursive: true, force: true });

const codes = await Promise.all(
  browsers.map((browser) =>
    run(
      [
        "playwright",
        "test",
        `--project=visual-${browser}`,
        "--workers=1",
        "--reporter=list,blob",
        ...extraArgs,
      ],
      { PLAYWRIGHT_BLOB_OUTPUT_DIR: `${rawReportDir}/${browser}` },
    ),
  ),
);

if (!recording) {
  mkdirSync(mergedReportDir, { recursive: true });
  for (const browser of browsers) {
    const dir = path.join(rawReportDir, browser);
    for (const file of readdirSync(dir)) {
      copyFileSync(path.join(dir, file), path.join(mergedReportDir, `${browser}-${file}`));
    }
  }

  await run(["playwright", "merge-reports", "--reporter=html", `./${mergedReportDir}`], {
    PLAYWRIGHT_HTML_OPEN: process.env.PLAYWRIGHT_HTML_OPEN ?? "always",
  });
}

process.exit(codes.some((code) => code !== 0) ? 1 : 0);
