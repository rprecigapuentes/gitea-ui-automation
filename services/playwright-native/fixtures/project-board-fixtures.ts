// Chained onto the organization fixtures, not onto `fixture` directly, because the demo scenario
// needs this file's seeded organization and that file's seeded users at once. Playwright resolves a
// fixture only when a test asks for it, so a board spec runs none of the ones it gains here.
import { test as base } from "./organizations-fixtures";
import { testDataName, uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import type { SeededRepository } from "@gitea-automation/business-logic/state/scenario.entity";
import type { SeededMilestone } from "@gitea-automation/business-logic/entities/milestone.entity";
import { logger } from "@gitea-automation/core-logger/pino.logger";

/** The tag `project-board.feature` carries, kept so a run can select the board smoke by it. */
export const PROJECT_BOARD_TAG = "@project-board";

const PROJECT_BOARD_REPOSITORY_COUNT = 2;
const SEEDED_MILESTONE_DUE_DAYS = 7;
const SEEDED_MILESTONE_DESCRIPTION = "Demo end to end";
const MS_PER_DAY = 86_400_000;

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
  seededMilestone: SeededMilestone;
}

/**
 * `project-board.feature`'s `Background`, as the two fixtures the scenarios ask for: the seeded
 * organization, and the project opened on top of it. The precondition runs before `use()` and the
 * postcondition after, which Playwright runs even when the test fails.
 */
export const test = base.extend<ProjectBoardFixtures>({
  seededOrganizationWithRepositories: async ({ clients, scenarioState }, use, testInfo) => {
    const organizationName = `at-board-${testInfo.project.name}-${uniqueSuffix()}`;
    await clients.organizations.createOrganization(organizationName);
    // `PageFactory` builds the organization pages from here, so the facade cannot be opened until
    // this is recorded. The Cucumber hook records the same visibility.
    scenarioState.organization = { name: organizationName, visibility: "private" };

    const repositories: SeededRepository[] = [];
    for (let index = 1; index <= PROJECT_BOARD_REPOSITORY_COUNT; index += 1) {
      const repositoryName = `at-repo-${index}-${testInfo.project.name}-${uniqueSuffix()}`;
      await clients.repositories.createOrganizationRepository(organizationName, repositoryName);

      const title = testDataName("S2-SMK-DND", `Issue-${index}`);
      const issue = await clients.issues.createIssue(organizationName, repositoryName, title);

      repositories.push({ name: repositoryName, issue });
    }

    await use({ organizationName, repositories });

    // Cleared before the deletes below, so `cleanupCreatedOrganization`, which tears down after
    // this fixture, does not try to remove an organization that is already gone.
    scenarioState.organization = undefined;

    for (const repository of repositories) {
      await clients.repositories.deleteRepository(organizationName, repository.name);
    }
    await clients.organizations.deleteOrganization(organizationName);
  },

  // `demo-e2e.feature`'s own `Before` hook: the milestone on the first seeded repository that the
  // scenario closes an issue against. Deleting the repository takes it with it.
  seededMilestone: async ({ clients, seededOrganizationWithRepositories }, use) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [firstRepository] = repositories;
    const dueDate = new Date(Date.now() + SEEDED_MILESTONE_DUE_DAYS * MS_PER_DAY);
    const title = testDataName("S2-DEMO-MS", "Release");

    const { id } = await clients.milestones.createMilestone(
      organizationName,
      firstRepository.name,
      {
        title,
        description: SEEDED_MILESTONE_DESCRIPTION,
        due_on: dueDate.toISOString(),
      },
    );

    logger.debug(
      { id, title, repository: firstRepository.name, dueOn: dueDate.toISOString() },
      "Seeded the milestone the scenario closes an issue against",
    );

    await use({ id, title, description: SEEDED_MILESTONE_DESCRIPTION, dueDate });
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
