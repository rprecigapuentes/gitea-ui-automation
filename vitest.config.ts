import { defineConfig } from "vitest/config";

const browsers = ["chrome", "firefox", "edge"] as const;

const browserStackPlatforms = [
  { name: "bs-win-chrome", browser: "chrome", os: "Windows", osVersion: "11" },
  { name: "bs-win-firefox", browser: "firefox", os: "Windows", osVersion: "11" },
  { name: "bs-win-edge", browser: "edge", os: "Windows", osVersion: "11" },
] as const;

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 60000,
    setupFiles: ["allure-vitest/setup", "./core/config/allure.config.ts"],
    reporters: ["default", "junit", ["allure-vitest/reporter", { resultsDir: "allure-results" }]],
    outputFile: { junit: "./reports/junit.xml" },
    fileParallelism: true,
    maxWorkers: Number(process.env.MAX_WORKERS ?? 3),

    projects: [
      ...browsers.map((browser) => ({
        extends: true as const,
        test: {
          name: browser,
          env: { BROWSER: browser },
        },
      })),

      ...browserStackPlatforms.map((platform) => ({
        extends: true as const,
        test: {
          name: platform.name,
          env: {
            BROWSERSTACK: "true",
            BROWSER: platform.browser,
            BROWSERSTACK_OS: platform.os,
            BROWSERSTACK_OS_VERSION: platform.osVersion,
          },
          globalSetup: ["./core/config/browserstack.global-setup.ts"],
        },
      })),
    ],
  },
});
