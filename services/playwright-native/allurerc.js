import { defineConfig } from "allure";

export default defineConfig({
  name: "Gitea UI Automation - Playwright",
  output: "./allure-report",
  plugins: {
    awesome: {
      options: {
        singleFile: true,
        reportLanguage: "en",
      },
    },
  },
});
