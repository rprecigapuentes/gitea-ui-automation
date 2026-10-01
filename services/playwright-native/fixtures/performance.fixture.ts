import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, type TestInfo } from "@playwright/test";
import {
  PerformanceCollector,
  type Metric,
  type PageMeasurement,
} from "@gitea-automation/core-playwright/performance-collector/performance-collector";
import { test as base } from "./fixture";

/** Enough loads for a median to mean something without doubling the suite's duration. */
const LOADS = 5;

/** Upper bound as a multiple of the median recorded for a metric. The engine counters and the
 *  largest paint carry no band: they explain a figure, they do not decide it. */
const TOLERANCE: Partial<Record<Metric, number>> = {
  requests: 1.1,
  transferredBytes: 1.1,
  ttfb: 2,
  domContentLoaded: 2,
  load: 2,
  firstContentfulPaint: 2,
};

/** Floor under a band, in the unit of its metric, so a small median cannot produce a band narrow
 *  enough for ordinary noise to break. A count needs no floor. */
const FLOOR: Partial<Record<Metric, number>> = {
  ttfb: 50,
  domContentLoaded: 250,
  load: 250,
  firstContentfulPaint: 250,
};

type Band = Partial<Record<Metric, number>>;

interface Baseline {
  cold: Band;
  warm: Band;
}

interface PerformanceFixtures {
  performanceCollector: PerformanceCollector;
  publishMeasurement: (measurement: PageMeasurement) => Promise<void>;
  verifyAgainstBaseline: (measurement: PageMeasurement) => Promise<void>;
}

/** Both artifacts of a run land here: `reports/` is what the workflow uploads, and unlike the
 *  test's own output directory it is not removed when the test passes. */
function reportsDirectory(testInfo: TestInfo): string {
  // Not config.rootDir, which is the common ancestor of every project's testDir.
  const workspace = testInfo.config.configFile
    ? path.dirname(testInfo.config.configFile)
    : process.cwd();

  return path.join(workspace, "reports", "performance");
}

/** `<page>-<browser>`, the name both artifacts of one measurement carry. The page comes from the
 *  spec file, which is named for it, because the recording starts before the test names it. */
function artifactName(testInfo: TestInfo): string {
  const page = path.basename(testInfo.file).replace(/\.spec\.ts$/, "");
  const browser = testInfo.project.name.slice(testInfo.project.name.lastIndexOf("-") + 1);

  return `${page}-${browser}`;
}

/** Extends the suite's fixture, not Playwright's, so a measurement signs in through
 *  `sessionManager` and navigates through the page objects the functional tests use. */
export const test = base.extend<PerformanceFixtures>({
  /* Each test records its own exchange; a path fixed in the config would have them overwrite it. */
  contextOptions: async ({ contextOptions }, use, testInfo) => {
    await mkdir(reportsDirectory(testInfo), { recursive: true });

    await use({
      ...contextOptions,
      recordHar: {
        path: path.join(reportsDirectory(testInfo), `${artifactName(testInfo)}.har`),
        content: "omit",
        mode: "full",
      },
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

      await testInfo.attach("performance-measurement", {
        body,
        contentType: "application/json",
      });

      await mkdir(reportsDirectory(testInfo), { recursive: true });
      await writeFile(
        path.join(reportsDirectory(testInfo), `${artifactName(testInfo)}.json`),
        body,
        "utf8",
      );
    });
  },

  verifyAgainstBaseline: async ({}, use, testInfo) => {
    await use(async (measurement) => {
      const file = path.join(path.dirname(testInfo.file), "baselines", `${measurement.page}.json`);
      const recorded = await readBaseline(file);

      // The first run writes the band and fails on purpose, so a band nobody reviewed never passes.
      if (!recorded) {
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, `${JSON.stringify(bandOf(measurement), null, 2)}\n`, "utf8");
        throw new Error(`No band was recorded for ${measurement.page}; this run wrote one`);
      }

      /* Soft, so one metric leaving its band still reports the others: the set of metrics that
         moved together is what says whether the page or the machine changed. */
      for (const phase of ["cold", "warm"] as const) {
        for (const [metric, bound] of Object.entries(recorded[phase]) as [Metric, number][]) {
          const observed = measurement[phase][metric]?.median;
          if (observed === undefined) continue;
          expect
            .soft(observed, `${measurement.page} ${phase} ${metric}`)
            .toBeLessThanOrEqual(bound);
        }
      }
    });
  },
});

function bandOf(measurement: PageMeasurement): Baseline {
  const bandFor = (phase: "cold" | "warm"): Band =>
    Object.fromEntries(
      (Object.entries(TOLERANCE) as [Metric, number][]).flatMap(([metric, factor]) => {
        const summary = measurement[phase][metric];
        if (!summary) return [];
        return [[metric, Math.ceil(Math.max(summary.median * factor, FLOOR[metric] ?? 0))]];
      }),
    );

  return { cold: bandFor("cold"), warm: bandFor("warm") };
}

async function readBaseline(file: string): Promise<Baseline | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as Baseline;
  } catch {
    // A missing or unreadable file means there is no band yet; the caller records one.
    return null;
  }
}

export { expect } from "@playwright/test";
