import { test as base } from "./hooks-fixtures";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";

interface KanbanProject {
  id: number;
  title: string;
}

interface ProjectBoardFixtures {
  kanbanProject: KanbanProject;
}

/**
 * The rest of `project-board.feature`'s Background, on top of the organization and repositories
 * `hooks-fixtures.ts` seeds: the owner's session and the project the board scenarios open.
 * Deleting the organization takes the project with it, so there is nothing to undo after `use()`.
 */
export const test = base.extend<ProjectBoardFixtures>({
  kanbanProject: async (
    { pageObjects, sessionManager, seededOrganizationWithRepositories },
    use,
  ) => {
    const { organizationName } = seededOrganizationWithRepositories;
    const title = testDataName("S2-SMK-ISS", "Project");

    await sessionManager.loginAsOwner();
    await pageObjects.createProjectPage.openFor(organizationName);
    await pageObjects.createProjectPage.createFromBasicKanban(title);
    await pageObjects.projectListPage.openFor(organizationName);

    await use({ id: await pageObjects.projectListPage.getOnlyProjectId(), title });
  },
});

export { PROJECT_BOARD_TAG } from "./hooks-fixtures";
export { expect } from "@playwright/test";
