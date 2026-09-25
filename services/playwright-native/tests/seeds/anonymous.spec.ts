import { test } from "../../fixtures/fixture";

/* The state an agent is handed for a scenario whose subject is signing in. A plan names this file
   by path; nothing selects it by default. */
test.describe("Agent starting state", () => {
  test("anonymous", async ({ pageObjects }) => {
    await pageObjects.loginPage.open();
  });
});
