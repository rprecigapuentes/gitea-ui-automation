import { defineConfig } from "allure";

export default defineConfig({
  name: "Gitea UI Automation - Playwright BDD",
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
