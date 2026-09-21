import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "node_modules",
      "coverage",
      "test-results",
      "reports",
      "allure-results",
      "allure-report",
      /* The html reporter bundles Playwright's own trace viewer here, browser code lint cannot read.
         A bare directory name does not match its contents, so the glob is required. */
      "**/playwright-report/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      "no-empty-pattern": ["error", { allowObjectPatternsAsParameters: true }],
    },
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: { globals: { process: "readonly", console: "readonly" } },
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);
