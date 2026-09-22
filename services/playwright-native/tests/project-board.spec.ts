import { test, expect } from "../fixtures/project-board-fixtures";
import type { PageFactory } from "@gitea-automation/business-logic/pages/page.factory";
import type { SeededRepository } from "@gitea-automation/business-logic/state/scenario.entity";

const TEMPLATE_COLUMNS = ["Backlog", "To Do", "In Progress", "Done"];
const DEFAULT_COLUMN = "Backlog";
const ADDED_COLUMN = "Review";
const NEW_DEFAULT_COLUMN = "To Do";

async function addIssueToProject(
  pageObjects: PageFactory,
  organizationName: string,
  repository: SeededRepository,
  projectId: number,
): Promise<void> {
  await pageObjects.issuePage.openFor(organizationName, repository.name, repository.issue.number);
  await pageObjects.issuePage.assignProject(projectId);
}

test.describe("Organization project board", () => {
  test("the Basic Kanban template lays the board out", async ({
    pageObjects,
    seededOrganizationWithRepositories,
    kanbanProject,
  }) => {
    const { organizationName } = seededOrganizationWithRepositories;

    await pageObjects.projectBoardPage.openFor(organizationName, kanbanProject.id);

    expect(await pageObjects.projectBoardPage.getColumnTitles()).toEqual(TEMPLATE_COLUMNS);
    expect(await pageObjects.projectBoardPage.getDefaultColumnTitle()).toBe(DEFAULT_COLUMN);
  });

  test("an issue added to the project lands in the default column", async ({
    pageObjects,
    seededOrganizationWithRepositories,
    kanbanProject,
  }) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [first] = repositories;

    await addIssueToProject(pageObjects, organizationName, first, kanbanProject.id);
    await pageObjects.projectBoardPage.openFor(organizationName, kanbanProject.id);

    expect(await pageObjects.projectBoardPage.defaultColumnHoldsIssue(first.issue.id)).toBe(true);
    expect(await pageObjects.projectBoardPage.getDefaultColumnIssueCount()).toBe(1);
  });

  test("a column added from the board appears on it", async ({
    pageObjects,
    seededOrganizationWithRepositories,
    kanbanProject,
  }) => {
    const { organizationName } = seededOrganizationWithRepositories;

    await pageObjects.projectBoardPage.openFor(organizationName, kanbanProject.id);
    await pageObjects.projectBoardPage.addColumn(ADDED_COLUMN);
    await pageObjects.projectBoardPage.openFor(organizationName, kanbanProject.id);

    expect(await pageObjects.projectBoardPage.isColumnVisible(ADDED_COLUMN)).toBe(true);
  });

  test("the default column cannot be deleted and takes in the cards of a deleted one", async ({
    pageObjects,
    seededOrganizationWithRepositories,
    kanbanProject,
  }) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [first] = repositories;

    await addIssueToProject(pageObjects, organizationName, first, kanbanProject.id);
    await pageObjects.projectBoardPage.openFor(organizationName, kanbanProject.id);
    await pageObjects.projectBoardPage.makeColumnDefault(NEW_DEFAULT_COLUMN);
    await pageObjects.projectBoardPage.openFor(organizationName, kanbanProject.id);

    expect(await pageObjects.projectBoardPage.columnOffersDelete(NEW_DEFAULT_COLUMN)).toBe(false);
    expect(await pageObjects.projectBoardPage.columnOffersDelete(DEFAULT_COLUMN)).toBe(true);

    await pageObjects.projectBoardPage.deleteColumn(DEFAULT_COLUMN);
    await pageObjects.projectBoardPage.openFor(organizationName, kanbanProject.id);

    expect(await pageObjects.projectBoardPage.boardHidesColumn(DEFAULT_COLUMN)).toBe(true);
    expect(
      await pageObjects.projectBoardPage.columnHoldsIssue(NEW_DEFAULT_COLUMN, first.issue.id),
    ).toBe(true);
  });
});
