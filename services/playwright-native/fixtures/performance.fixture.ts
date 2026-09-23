import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  PerformanceCollector,
  type PageMeasurement,
} from "@gitea-automation/core-playwright/performance-collector/performance-collector";
import { test as base } from "./fixture";

/** Enough loads for a median to mean something without doubling the suite's duration. */
const LOADS = 5;

interface PerformanceFixtures {
  performanceCollector: PerformanceCollector;
  publishMeasurement: (measurement: PageMeasurement) => Promise<void>;
}

/** Extends the suite's fixture, not Playwright's, so a measurement signs in through
 *  `sessionManager` and navigates through the page objects the functional tests use. */
export const test = base.extend<PerformanceFixtures>({
  /* Each test records its own exchange; a path fixed in the config would have them overwrite it. */
  contextOptions: async ({ contextOptions }, use, testInfo) => {
    await use({
      ...contextOptions,
      recordHar: { path: testInfo.outputPath("network.har"), content: "omit", mode: "full" },
    });
  },

  performanceCollector: async ({ context, page }, use) => {
    const session = await context.newCDPSession(page);
    await session.send("Performance.enable");
    await session.send("Network.enable");

    await use(new PerformanceCollector(page, session, LOADS));

    await session.detach();
  },

  publishMeasurement: async ({}, use, testInfo) => {
    await use(async (measurement) => {
      const body = JSON.stringify(measurement, null, 2);
      const browser = testInfo.project.name.slice(testInfo.project.name.lastIndexOf("-") + 1);

      await testInfo.attach("performance-measurement", {
        body,
        contentType: "application/json",
      });

      // Not config.rootDir, which is the common ancestor of every project's testDir.
      const workspace = testInfo.config.configFile
        ? path.dirname(testInfo.config.configFile)
        : process.cwd();
      const directory = path.join(workspace, "reports", "performance");

      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, `${measurement.page}-${browser}.json`), body, "utf8");
    });
  },
});

export { expect } from "@playwright/test";
