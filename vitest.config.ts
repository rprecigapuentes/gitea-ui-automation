import { defineConfig } from "vitest/config";

const browsers = ["chrome", "firefox", "edge"] as const;

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
    projects: browsers.map((browser) => ({
      extends: true,
      test: { name: browser, env: { BROWSER: browser } },
    })),
  },
});
