import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

/* Set by test:chrome/test:firefox/test:edge, unset by the scripts that run the three at once. */
const singleBrowser = process.env.BROWSER;

/* Without a channel, Desktop Chrome and Desktop Edge both run the bundled Chromium. */
const browsers = [
  { name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "edge", use: { ...devices["Desktop Edge"], channel: "msedge" } },
];

/* A scan runs on bundled Chromium, which every Playwright install already carries. The branded
   projects are defined for the same scans but not run by default: axe evaluates the DOM, so all
   four agree, and the recorded baselines are shared. */
const scanBrowsers = [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }, ...browsers];

/* These projects take no retry, so the global on-first-retry trace would never be recorded.
   Retaining on failure keeps the cost to the scans worth investigating. */
const nonFunctional = {
  testDir: "./tests/non-functional/accessibility",
  snapshotPathTemplate: "{testDir}/baselines/{arg}{ext}",
  retries: 0,
  use: { trace: "retain-on-failure" as const },
};

const visual = {
  testDir: "./tests/non-functional/visual",
  snapshotPathTemplate: "{testDir}/baselines/{projectName}/{platform}/{arg}{ext}",
  retries: 0,
  /* Same reason as the scans above: with no retry, the global on-first-retry never fires. */
  use: { trace: "retain-on-failure" as const },
};

/* A measurement is taken alone. A retry would republish a warm load as the cold one, a trace
   charges the page for the collector's own overhead, and a second worker puts another browser on
   the machine being measured. */
const performance = {
  testDir: "./tests/non-functional/performance",
  retries: 0,
  workers: 1,
  use: { trace: "off" as const },
};

export default defineConfig({
  testDir: "./tests",
  // The cucumber e2e's ~10 login switches and page loads don't fit the 30 second default.
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    /* open: never, or the run ends by launching a browser and CI hangs on it. */
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["allure-playwright", { resultsDir: "allure-results" }],
    /* test:parallel starts one process per browser, and they would overwrite one file. */
    [
      "junit",
      { outputFile: singleBrowser ? `reports/junit-${singleBrowser}.xml` : "reports/junit.xml" },
    ],
  ],
  use: {
    baseURL: process.env.GITEA_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    /* HEADED=1 shows the browser windows, including under test:parallel. */
    headless: process.env.HEADED ? false : undefined,
  },

  projects: [
    ...browsers.map((browser) => ({
      ...browser,
      testIgnore: "**/non-functional/**",
      use: { ...browser.use, video: "on-first-retry" as const },
    })),

    ...scanBrowsers.map((browser) => ({
      ...browser,
      ...nonFunctional,
      name: `accessibility-${browser.name}`,
      /* Merged, not spread: nonFunctional's use would otherwise drop the browser's channel. */
      use: { ...browser.use, ...nonFunctional.use },
    })),

    ...browsers.map((browser) => ({
      ...browser,
      ...visual,
      name: `visual-${browser.name}`,
      /* Merged, not spread: visual's use would otherwise drop the browser's channel. */
      use: { ...browser.use, ...visual.use },
    })),

    /* Chromium alone: the engine counters come from a protocol no other browser speaks, and the
       name resolves to the Chrome account the workflows already seed. */
    {
      ...performance,
      name: "performance-chromium",
      use: { ...devices["Desktop Chrome"], ...performance.use },
    },
  ],
});
