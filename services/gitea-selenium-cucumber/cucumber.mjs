import "dotenv/config";

export default {
  import: ["features/step-definitions/**/*.ts", "features/support/**/*.ts"],
  paths: ["features/**/*.feature"],
  // "progress" for the console, Allure for the results `npm run report` reads.
  format: ["progress", "allure-cucumberjs/reporter"],
  formatOptions: {
    resultsDir: "allure-results",
  },
};
