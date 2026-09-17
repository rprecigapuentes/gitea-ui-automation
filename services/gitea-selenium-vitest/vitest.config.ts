import "dotenv/config";
import { defineConfig } from "vitest/config";

const browsers = ["chrome", "firefox", "edge"] as const;

const browserStackPlatforms = [
  { name: "bs-win-chrome", browser: "chrome", os: "Windows", osVersion: "11" },
  { name: "bs-win-firefox", browser: "firefox", os: "Windows", osVersion: "11" },
  { name: "bs-win-edge", browser: "edge", os: "Windows", osVersion: "11" },
] as const;

const singleBrowser = process.env.BROWSER;

export default defineConfig({
  test: {
    globals: true,
    // Measured on the CT grid with the implicit wait gone: organizations.test.ts takes 27.8s on
    // chrome, so 30000 leaves two seconds of margin and 60000 leaves the room that grid needs.
    testTimeout: 60000,
    hookTimeout: 60000,
    setupFiles: ["allure-vitest/setup", "./config/allure.config.ts"],
    reporters: ["default", "junit", ["allure-vitest/reporter", { resultsDir: "allure-results" }]],
    outputFile: {
      junit: singleBrowser ? `./reports/junit-${singleBrowser}.xml` : "./reports/junit.xml",
    },
    fileParallelism: true,
    maxWorkers: Number(process.env.MAX_WORKERS ?? 3),
    server: {
      deps: {
        inline: [
          "@gitea-automation/core-selenium",
          "@gitea-automation/core-config",
          "@gitea-automation/core-logger",
          "@gitea-automation/core-data-handler",
          "@gitea-automation/business-logic-selenium",
          "@gitea-automation/business-logic-common",
        ],
      },
    },

    projects: [
      ...browsers.map((browser) => ({
        extends: true as const,
        test: {
          name: browser,
          env: { BROWSER: browser },
          fileParallelism: false,
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
          globalSetup: ["./config/browserstack.global-setup.ts"],
        },
      })),
    ],
  },
});
