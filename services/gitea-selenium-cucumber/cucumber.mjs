import "dotenv/config";

// Set by test:chrome/test:firefox/test:edge. test:parallel runs those three as three processes
// against this one file, so the junit path carries the browser.
const singleBrowser = process.env.BROWSER;

export default {
  import: ["features/step-definitions/**/*.ts", "features/support/**/*.ts"],
  paths: ["features/**/*.feature"],
  // "progress" for the console, Allure for the results `npm run report` reads, junit for the
  // format every functional suite shares.
  format: [
    "progress",
    "allure-cucumberjs/reporter",
    `junit:${singleBrowser ? `reports/junit-${singleBrowser}.xml` : "reports/junit.xml"}`,
  ],
  formatOptions: {
    resultsDir: "allure-results",
  },
  // Empty and unset both mean "every scenario" - see test:tag:parallel/test:all:parallel.
  tags: process.env.CUCUMBER_TAGS || undefined,
};
