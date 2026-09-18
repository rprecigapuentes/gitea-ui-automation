import { test, expect, PROJECT_BOARD_TAG } from "../fixtures/hooks-fixtures";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";

const TARGET_COLUMN = "In Progress";

test.describe("Project board drag and drop", () => {
  test(
    "a card dragged onto another column is kept there by the board",
    { tag: PROJECT_BOARD_TAG },
    async ({ pageObjects, sessionManager, seededOrganizationWithRepositories }) => {
      const { organizationName, repositories } = seededOrganizationWithRepositories;

      await sessionManager.loginAsOwner();

      const projectTitle = testDataName("S2-SMK-DND", "Project");
      await pageObjects.createProjectPage.openFor(organizationName);
      await pageObjects.createProjectPage.createFromBasicKanban(projectTitle);
      await pageObjects.projectListPage.openFor(organizationName);
      const projectId = await pageObjects.projectListPage.getOnlyProjectId();

      for (const repository of repositories) {
        await pageObjects.issuePage.openFor(
          organizationName,
          repository.name,
          repository.issue.number,
        );
        await pageObjects.issuePage.assignProject(projectId);
      }

      await pageObjects.projectBoardPage.openFor(organizationName, projectId);

      const [first, second] = repositories;
      await pageObjects.projectBoardPage.moveCard(first.issue.id, TARGET_COLUMN);

      expect(await pageObjects.projectBoardPage.getColumnCardIssueIds(TARGET_COLUMN)).toEqual([
        first.issue.id,
      ]);
      expect(await pageObjects.projectBoardPage.getColumnIssueCount(TARGET_COLUMN)).toBe(1);
      expect(await pageObjects.projectBoardPage.getDefaultColumnCardIssueIds()).toEqual([
        second.issue.id,
      ]);
      expect(await pageObjects.projectBoardPage.getDefaultColumnIssueCount()).toBe(1);
    },
  );
});
