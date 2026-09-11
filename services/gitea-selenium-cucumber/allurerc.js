import { defineConfig } from "allure";

export default defineConfig({
  name: "Gitea UI Automation - Cucumber",
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
