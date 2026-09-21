import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

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

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    /* open: never, or the run ends by launching a browser and CI hangs on it. */
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["allure-playwright", { resultsDir: "allure-results" }],
  ],
  use: {
    baseURL: process.env.GITEA_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    /* HEADED=1 shows the browser windows, including under test:parallel. */
    headless: process.env.HEADED ? false : undefined,
  },

  projects: [
    ...browsers.map((browser) => ({ ...browser, testIgnore: "**/non-functional/**" })),

    ...scanBrowsers.map((browser) => ({
      ...browser,
      ...nonFunctional,
      name: `accessibility-${browser.name}`,
      /* Merged, not spread: nonFunctional's use would otherwise drop the browser's channel. */
      use: { ...browser.use, ...nonFunctional.use },
    })),
  ],
});
