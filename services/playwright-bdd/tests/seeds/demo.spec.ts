import { test } from "./agent-fixtures";

/* The world `demo-e2e.feature` runs in: the seeded organization with its milestone, and the two
   users the scenario assigns work to and signs in as. A plan names this file by path. */
test.describe("Agent starting state", () => {
  test("demo", async ({
    seededOrganizationWithRepositories,
    seededMilestone,
    seededUsers,
    sessionManager,
    pageObjects,
  }) => {
    await sessionManager.loginAsOwner();
    await pageObjects.orgFacade.open();
    await pageObjects.orgFacade.waitForElements();
  });
});
