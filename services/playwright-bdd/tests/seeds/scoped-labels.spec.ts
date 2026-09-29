import { test } from "./agent-fixtures";

/* The world `scoped-labels.feature` runs in: a repository carrying the issue the scenario labels,
   on the label list where it creates the three scoped labels. A plan names this file by path. */
test.describe("Agent starting state", () => {
  test("scoped labels", async ({ owner, repository, issue, sessionManager, pageObjects }) => {
    await sessionManager.loginAsOwner();
    await pageObjects.labelListPage.openFor(owner, repository);
  });
});
