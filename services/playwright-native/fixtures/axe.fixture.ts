import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { logger } from "@gitea-automation/core-logger/pino.logger";
import { test as base } from "./fixture";

type ScanResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;

/** The set the Playwright documentation names. Widening it invalidates every baseline. */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

interface AxeFixtures {
  makeAxeBuilder: (exclusions?: string[]) => AxeBuilder;
  publishScan: (results: ScanResults, page: string) => Promise<void>;
}

/** Extends the suite's fixture, not Playwright's, so a scan signs in through `sessionManager`
 *  instead of driving the login form it evaluates. */
export const test = base.extend<AxeFixtures>({
  makeAxeBuilder: async ({ page }, use, testInfo) => {
    await use((exclusions = []) => {
      // Logged because an excluded region leaves no trace in the results: without this the run
      // says a scan was clean, not that part of the page was never read.
      if (exclusions.length > 0) {
        logger.info({ scan: testInfo.title, exclusions }, "Regions excluded from the scan");
      }

      return exclusions.reduce(
        (builder, selector) => builder.exclude(selector),
        new AxeBuilder({ page }).withTags(WCAG_TAGS),
      );
    });
  },

  publishScan: async ({}, use, testInfo) => {
    await use(async (results, pageName) => {
      const body = JSON.stringify(results, null, 2);
      const browser = testInfo.project.name.slice(testInfo.project.name.lastIndexOf("-") + 1);

      await testInfo.attach("accessibility-scan-results", {
        body,
        contentType: "application/json",
      });

      // Not config.rootDir, which is the common ancestor of every project's testDir.
      const workspace = testInfo.config.configFile
        ? path.dirname(testInfo.config.configFile)
        : process.cwd();
      const directory = path.join(workspace, "reports", "accessibility");

      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, `${pageName}-${browser}.json`), body, "utf8");
    });
  },
});

/**
 * One sorted `rule<tab>target` line per offending element. The raw result carries timings and
 * every node's HTML, so it differs on every run; lines keep the committed baseline readable in
 * a diff, where the JSON of the documentation's own fingerprint spends four lines per element.
 */
export function violationFingerprints(results: ScanResults): string {
  return results.violations
    .flatMap((violation) =>
      violation.nodes.map((node) => `${violation.id}\t${node.target.flat().join(" ")}`),
    )
    .sort()
    .join("\n");
}

export { expect } from "@playwright/test";
