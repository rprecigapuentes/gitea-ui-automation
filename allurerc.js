import { defineConfig } from "allure";

const browser = process.env.BROWSER;

export default defineConfig({
  name: browser ? `Gitea UI Automation (${browser})` : "Gitea UI Automation",
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
