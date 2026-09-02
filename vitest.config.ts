import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 60000,
    reporters: ["default", "junit", "html"],
    outputFile: {
      junit: "./reports/junit.xml",
      html: "./reports/html/index.html",
    },
  },
});
