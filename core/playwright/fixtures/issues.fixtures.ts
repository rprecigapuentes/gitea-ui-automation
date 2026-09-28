import type { Fixtures, PlaywrightTestArgs, PlaywrightTestOptions } from "@playwright/test";
import { testDataName, uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import type { SeededIssue } from "@gitea-automation/business-logic/entities/issue.entity";
import type { SeededLabel } from "@gitea-automation/business-logic/entities/label.entity";
import type { SeededMilestone } from "@gitea-automation/business-logic/entities/milestone.entity";
import type { User } from "@gitea-automation/business-logic/entities/user.entity";
import type { CoreFixtures } from "./base.fixtures";
import { resolveOwnerCredentials } from "./credentials";

const MILESTONE_DUE_IN_DAYS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface IssuesFixtures {
  owner: string;
  repository: string;
  issue: SeededIssue;
  maintainer: User;
  classificationLabel: SeededLabel;
  milestone: SeededMilestone;
}

/**
 * The API-seeded state the two issue cases start from, mirroring the fixtures of the same names in
 * `gitea-selenium-vitest/src/fixtures/fixture.ts`. Each precondition runs before `use()` and its
 * postcondition after, so Playwright tears the repository down even when the test fails. Deleting
 * the repository takes its issues, labels and milestones with it, which is why only `repository`
 * cleans up.
 */
export const issuesFixtures: Fixtures<
  IssuesFixtures,
  object,
  CoreFixtures & PlaywrightTestArgs & PlaywrightTestOptions
> = {
  owner: async ({}, use, testInfo) => {
    await use(resolveOwnerCredentials(testInfo.project.name).username);
  },

  repository: async ({ clients, owner }, use, testInfo) => {
    const name = `test-issues-${Date.now()}-${testInfo.project.name}-${uniqueSuffix()}`;
    await clients.repositories.createRepository(name);

    await use(name);

    await clients.repositories.deleteRepository(owner, name);
  },

  issue: async ({ clients, owner, repository }, use) => {
    const title = "Scoped labels acceptance";
    const { id, number } = await clients.issues.createIssue(owner, repository, title);

    await use({ id, number, title });
  },

  maintainer: async ({ clients }, use) => {
    await use(await clients.users.getUser());
  },

  classificationLabel: async ({ clients, owner, repository }, use) => {
    const name = testDataName("ISS-01", "Label");
    const { id } = await clients.labels.createLabel(owner, repository, {
      name,
      color: "#5319e7",
      exclusive: false,
    });

    await use({ id, name });
  },

  milestone: async ({ clients, owner, repository }, use) => {
    const title = testDataName("ISS-01", "Milestone");
    const description = "Milestone the created issue has to advance when it is closed";
    const dueDate = new Date(Date.now() + MILESTONE_DUE_IN_DAYS * DAY_IN_MS);
    const { id } = await clients.milestones.createMilestone(owner, repository, {
      title,
      description,
      due_on: dueDate.toISOString(),
    });

    await use({ id, title, description, dueDate });
  },
};
