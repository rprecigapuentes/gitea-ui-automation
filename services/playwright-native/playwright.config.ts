import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["allure-playwright", { resultsDir: "allure-results" }]],
  use: {
    baseURL: process.env.GITEA_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    /* HEADED=1 shows the browser windows, including under test:parallel. */
    headless: process.env.HEADED ? false : undefined,
  },

  /* Without a channel, Desktop Chrome and Desktop Edge both run the bundled Chromium. */
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "edge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
  ],
});
