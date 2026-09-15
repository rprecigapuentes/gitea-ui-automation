import "dotenv/config";
import { Before, BeforeAll, After, AfterAll, setDefaultTimeout } from "@cucumber/cucumber";
import { DriverFactory } from "@gitea-automation/core-selenium/ui/drivers/driver.factory";
import { OrganizationClient } from "@gitea-automation/business-logic-selenium/api/clients/organizations.client";
import { RepositoryClient } from "@gitea-automation/business-logic-selenium/api/clients/repository.client";
import { IssueClient } from "@gitea-automation/business-logic-selenium/api/clients/issue.client";
import { TeamClient } from "@gitea-automation/business-logic-selenium/api/clients/team.client";
import { MilestoneClient } from "@gitea-automation/business-logic-selenium/api/clients/milestone.client";
import type {
  ScenarioState,
  SeededRepository,
} from "@gitea-automation/business-logic-selenium/state/scenario.entity";
import { testDataName, uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import { PageFactory } from "./page.factory";
import { resolveOwnerToken } from "./credentials";
import { createSeededUsers, deleteSeededUsers } from "./seeded-users";
import type { GiteaWorld } from "./world";

setDefaultTimeout(20000);

const PROJECT_BOARD_TAG = "@project-board";
const TEAM_REPOSITORY_TAG = "@team-repository";
const DEMO_E2E_TAG = "@demo-e2e";
const CLEANUP_TAG = "@cleanup";
const SEEDED_REPOSITORY_COUNT = 2;
const SEEDED_MILESTONE_DUE_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SEEDED_TEAM_NAME = "team-1";
const SEEDED_REPOSITORY_NAME = "frontend";

// Gitea caps an organization name at 40 characters.
function seededName(prefix: string): string {
  return `at-${prefix}-${process.env.BROWSER ?? "local"}-${uniqueSuffix()}`;
}

function ownerClients(): {
  organizations: OrganizationClient;
  repositories: RepositoryClient;
  issues: IssueClient;
  teams: TeamClient;
  milestones: MilestoneClient;
} {
  const baseUrl = process.env.GITEA_BASE_URL!;
  const token = resolveOwnerToken();

  return {
    organizations: new OrganizationClient(baseUrl, token),
    repositories: new RepositoryClient(baseUrl, token),
    issues: new IssueClient(baseUrl, token),
    teams: new TeamClient(baseUrl, token),
    milestones: new MilestoneClient(baseUrl, token),
  };
}

// One organization, two repositories, one issue in each: the state both board features start from.
async function seedOrganizationWithIssues(world: GiteaWorld, prefix: string): Promise<void> {
  const { organizations, repositories: repositoryClient, issues } = ownerClients();
  const organizationName = seededName(prefix);

  await organizations.createOrganization(organizationName);
  world.scenarioState.organization = { name: organizationName, visibility: "private" };

  const repositories: SeededRepository[] = [];

  for (let index = 1; index <= SEEDED_REPOSITORY_COUNT; index += 1) {
    const repositoryName = seededName(`repo-${index}`);
    await repositoryClient.createOrganizationRepository(organizationName, repositoryName);

    const title = testDataName("S2-SMK-ISS", `Issue-${index}`);
    const { body: issue } = await issues.createIssue(organizationName, repositoryName, title);

    repositories.push({
      name: repositoryName,
      issue: { id: issue.id, number: issue.number, title },
    });
  }

  world.scenarioState.repositories = repositories;
}

// Clears leftovers before any scenario's Before hooks run.
// Scoped to this token's own account, so parallel browsers can't collide.
BeforeAll(async () => {
  const { organizations } = ownerClients();
  await organizations.deleteAllOrganizations();
  await createSeededUsers();
});

AfterAll(async () => {
  await deleteSeededUsers();
});

Before(async function (this: GiteaWorld) {
  this.driver = await DriverFactory.getDriver();
  const scenarioState: ScenarioState = {};
  this.scenarioState = scenarioState;
  this.pages = new PageFactory(this.driver, scenarioState);
});

Before({ tags: PROJECT_BOARD_TAG }, async function (this: GiteaWorld) {
  await seedOrganizationWithIssues(this, "board");
});

// The demo case adds a milestone to the first repository, which it closes an issue against.
Before({ tags: DEMO_E2E_TAG }, async function (this: GiteaWorld) {
  await seedOrganizationWithIssues(this, "demo");

  const { milestones } = ownerClients();
  const organization = this.scenarioState.organization!;
  const [firstRepository] = this.scenarioState.repositories!;
  const dueDate = new Date(Date.now() + SEEDED_MILESTONE_DUE_DAYS * MS_PER_DAY);
  const title = testDataName("S2-DEMO-MS", "Release");

  const { body: milestone } = await milestones.createMilestone(
    organization.name,
    firstRepository.name,
    { title, description: "Demo end to end", due_on: dueDate.toISOString() },
  );

  this.scenarioState.milestone = {
    id: milestone.id,
    title,
    description: "Demo end to end",
    dueDate,
  };
});

Before({ tags: TEAM_REPOSITORY_TAG }, async function (this: GiteaWorld) {
  const { organizations, repositories: repositoryClient, teams } = ownerClients();
  const organizationName = seededName("team-repo");

  await organizations.createOrganization(organizationName);
  await teams.createTeam(organizationName, SEEDED_TEAM_NAME, "write");
  await repositoryClient.createOrganizationRepository(organizationName, SEEDED_REPOSITORY_NAME);

  this.scenarioState.organization = {
    name: organizationName,
    visibility: "private",
    teams: [
      {
        name: SEEDED_TEAM_NAME,
        visibility: "private",
        createRepositories: false,
        permissions: "general",
      },
    ],
    repositories: [{ name: SEEDED_REPOSITORY_NAME, visibility: true }],
  };
});

// Deletes the org for any feature tagged @cleanup.
After({ tags: CLEANUP_TAG }, async function (this: GiteaWorld) {
  const organization = this.scenarioState.organization;

  if (!organization) return;

  const { organizations, repositories } = ownerClients();

  // Gitea refuses to delete an organization that still owns repositories; the issues and the
  // projects do go with their owner.
  try {
    const repositoryNames = [
      ...(this.scenarioState.repositories ?? []),
      ...(organization.repositories ?? []),
    ].map((repository) => repository.name);

    for (const name of repositoryNames) {
      await repositories.deleteRepository(organization.name, name);
    }

    await organizations.deleteOrganization(organization.name);
  } catch (error) {
    console.error(`Could not delete the seeded organization "${organization.name}":`, error);
  }
});

After(async () => {
  await DriverFactory.quitDriver();
});
