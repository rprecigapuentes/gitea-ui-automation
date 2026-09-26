import { test } from "./agent-fixtures";

/* The state an agent is handed unless its plan names another file: signed in as this browser's
   owner, with a repository the fixtures created and remove. `owner` and `repository` are declared
   so those fixtures run, and so a generated step definition takes both from here rather than from
   the screen. */
test.describe("Agent starting state", () => {
  test("seed", async ({ owner, repository, sessionManager, pageObjects }) => {
    await sessionManager.loginAsOwner();
    await pageObjects.mainPage.open();
  });
});
