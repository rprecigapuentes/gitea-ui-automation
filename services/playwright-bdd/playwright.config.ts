import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { defineBddProject } from "playwright-bdd";

/* Set by run:chrome/run:firefox/run:edge, unset by the script that runs the three in one process. */
const singleBrowser = process.env.BROWSER;

/* Without a channel, Desktop Chrome and Desktop Edge both run the bundled Chromium. */
const browsers = [
  { name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "edge", use: { ...devices["Desktop Edge"], channel: "msedge" } },
];

export default defineConfig({
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
    /* One process per browser would overwrite a single file. */
    [
      "junit",
      { outputFile: singleBrowser ? `reports/junit-${singleBrowser}.xml` : "reports/junit.xml" },
    ],
  ],
  use: {
    baseURL: process.env.GITEA_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    /* HEADED=1 shows the browser windows. */
    headless: process.env.HEADED ? false : undefined,
  },

  projects: browsers.map((browser) => ({
    ...defineBddProject({
      name: browser.name,
      features: "features/scenarios/*.feature",
      steps: ["features/step-definitions/*.ts", "fixtures/fixture.ts"],
    }),
    use: { ...browser.use, video: "on-first-retry" as const },
  })),
});
