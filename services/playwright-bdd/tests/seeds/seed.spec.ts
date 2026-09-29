import { test } from "./agent-fixtures";

/* The default starting state: signed in as this browser's owner, inside a repository the fixtures
   own. `owner` and `repository` are declared so those fixtures run. */
test.describe("Agent starting state", () => {
  test("seed", async ({ owner, repository, sessionManager, pageObjects }) => {
    await sessionManager.loginAsOwner();
    await pageObjects.mainPage.open();
  });
});
