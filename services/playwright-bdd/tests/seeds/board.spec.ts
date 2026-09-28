import { test } from "./agent-fixtures";

/* The board an agent is handed: the seeded organization and the Kanban project opened on it. A
   plan names this file by path. */
test.describe("Agent starting state", () => {
  test("board", async ({ seededOrganizationWithRepositories, kanbanProject, pageObjects }) => {
    await pageObjects.projectBoardPage.openFor(
      seededOrganizationWithRepositories.organizationName,
      kanbanProject.id,
    );
  });
});
