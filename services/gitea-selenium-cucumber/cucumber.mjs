import "dotenv/config";

export default {
  import: ["features/step-definitions/**/*.ts", "features/support/**/*.ts"],
  paths: ["features/**/*.feature"],
  // "progress" keeps the run readable while it happens; the Allure reporter
  // writes the machine-readable results that `npm run report` turns into the
  // HTML the pipeline publishes as its artifact.
  format: ["progress", "allure-cucumberjs/reporter"],
  formatOptions: {
    resultsDir: "allure-results",
  },
};
