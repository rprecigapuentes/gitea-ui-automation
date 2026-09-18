import { test, expect } from "../fixtures/fixture";
import { testDataName, uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import type { SeededRepository } from "@gitea-automation/business-logic/state/scenario.entity";

const REPOSITORY_COUNT = 2;
const TARGET_COLUMN = "In Progress";

test.describe("Project board drag and drop", () => {
  test("a card dragged onto another column is kept there by the board", async ({
    clients,
    pageObjects,
    sessionManager,
  }, testInfo) => {
    const organizationName = `at-board-${testInfo.project.name}-${uniqueSuffix()}`;
    await clients.organizations.createOrganization(organizationName);
    const repositories: SeededRepository[] = [];

    try {
      for (let index = 1; index <= REPOSITORY_COUNT; index += 1) {
        const repositoryName = `at-repo-${index}-${testInfo.project.name}-${uniqueSuffix()}`;
        await clients.repositories.createOrganizationRepository(organizationName, repositoryName);

        const title = testDataName("S2-SMK-DND", `Issue-${index}`);
        const issue = await clients.issues.createIssue(organizationName, repositoryName, title);

        repositories.push({ name: repositoryName, issue });
      }

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
    } finally {
      for (const repository of repositories) {
        await clients.repositories.deleteRepository(organizationName, repository.name);
      }
      await clients.organizations.deleteOrganization(organizationName);
    }
  });
});
