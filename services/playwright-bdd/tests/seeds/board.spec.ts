import { test } from "./agent-fixtures";

/* The state an agent is handed for a scenario about the project board: the seeded organization with
   its two repositories, and the Kanban project opened on top of it, both from the fixtures the board
   scenarios themselves declare. A plan names this file by path.

   Without it an agent exploring the board would wake up in the issues repository of `seed.spec.ts`
   and invent an organization, which is what the starting states exist to prevent. */
test.describe("Agent starting state", () => {
  test("board", async ({ seededOrganizationWithRepositories, kanbanProject, pageObjects }) => {
    await pageObjects.projectBoardPage.openFor(
      seededOrganizationWithRepositories.organizationName,
      kanbanProject.id,
    );
  });
});
