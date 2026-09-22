import { test as base } from "./fixture";
import { testDataName, uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import type { SeededRepository } from "@gitea-automation/business-logic/state/scenario.entity";

/** The tag `project-board.feature` carries, kept so a run can select the board smoke by it. */
export const PROJECT_BOARD_TAG = "@project-board";

const PROJECT_BOARD_REPOSITORY_COUNT = 2;

export interface SeededOrganizationWithRepositories {
  organizationName: string;
  repositories: SeededRepository[];
}

interface KanbanProject {
  id: number;
  title: string;
}

interface ProjectBoardFixtures {
  seededOrganizationWithRepositories: SeededOrganizationWithRepositories;
  kanbanProject: KanbanProject;
}

/**
 * `project-board.feature`'s `Background`, as the two fixtures the scenarios ask for: the seeded
 * organization, and the project opened on top of it. The precondition runs before `use()` and the
 * postcondition after, which Playwright runs even when the test fails.
 */
export const test = base.extend<ProjectBoardFixtures>({
  seededOrganizationWithRepositories: async ({ clients }, use, testInfo) => {
    const organizationName = `at-board-${testInfo.project.name}-${uniqueSuffix()}`;
    await clients.organizations.createOrganization(organizationName);

    const repositories: SeededRepository[] = [];
    for (let index = 1; index <= PROJECT_BOARD_REPOSITORY_COUNT; index += 1) {
      const repositoryName = `at-repo-${index}-${testInfo.project.name}-${uniqueSuffix()}`;
      await clients.repositories.createOrganizationRepository(organizationName, repositoryName);

      const title = testDataName("S2-SMK-DND", `Issue-${index}`);
      const issue = await clients.issues.createIssue(organizationName, repositoryName, title);

      repositories.push({ name: repositoryName, issue });
    }

    await use({ organizationName, repositories });

    for (const repository of repositories) {
      await clients.repositories.deleteRepository(organizationName, repository.name);
    }
    await clients.organizations.deleteOrganization(organizationName);
  },

  // Deleting the organization takes the project with it, so there is nothing to undo here.
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

export { expect } from "@playwright/test";
