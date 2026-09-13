import "dotenv/config";
import { Before, BeforeAll, After, setDefaultTimeout } from "@cucumber/cucumber";
import { DriverFactory } from "@gitea-automation/core-selenium/ui/drivers/driver.factory";
import { OrganizationClient } from "@gitea-automation/business-logic-selenium/api/clients/organizations.client";
import { RepositoryClient } from "@gitea-automation/business-logic-selenium/api/clients/repository.client";
import { IssueClient } from "@gitea-automation/business-logic-selenium/api/clients/issue.client";
import type {
  ScenarioState,
  SeededRepository,
} from "@gitea-automation/business-logic-selenium/state/scenario.entity";
import { testDataName, uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";
import { PageFactory } from "./page.factory";
import { resolveOwnerToken } from "./credentials";
import type { GiteaWorld } from "./world";

setDefaultTimeout(20000);

const PROJECT_BOARD_TAG = "@project-board";
const CLEANUP_TAG = "@cleanup";
const SEEDED_REPOSITORY_COUNT = 2;

// Gitea caps an organization name at 40 characters.
function seededName(prefix: string): string {
  return `at-${prefix}-${process.env.BROWSER ?? "local"}-${uniqueSuffix()}`;
}

function ownerClients(): {
  organizations: OrganizationClient;
  repositories: RepositoryClient;
  issues: IssueClient;
} {
  const baseUrl = process.env.GITEA_BASE_URL!;
  const token = resolveOwnerToken();

  return {
    organizations: new OrganizationClient(baseUrl, token),
    repositories: new RepositoryClient(baseUrl, token),
    issues: new IssueClient(baseUrl, token),
  };
}

// Clears leftovers before any scenario's Before hooks run.
BeforeAll(async () => {
  const { organizations } = ownerClients();
  await organizations.deleteAllOrganizations();
});

Before(async function (this: GiteaWorld) {
  this.driver = await DriverFactory.getDriver();
  const scenarioState: ScenarioState = {};
  this.scenarioState = scenarioState;
  this.pages = new PageFactory(this.driver, scenarioState);
});

Before({ tags: PROJECT_BOARD_TAG }, async function (this: GiteaWorld) {
  const { organizations, repositories: repositoryClient, issues } = ownerClients();
  const organizationName = seededName("board");

  await organizations.createOrganization(organizationName);
  this.scenarioState.organization = { name: organizationName, visibility: "private" };

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

  this.scenarioState.repositories = repositories;
});

// Deletes the org for any feature tagged @cleanup.
After({ tags: CLEANUP_TAG }, async function (this: GiteaWorld) {
  const organization = this.scenarioState.organization;

  if (!organization) return;

  const { organizations, repositories } = ownerClients();

  // Gitea refuses to delete an organization that still owns repositories; the issues and the
  // projects do go with their owner.
  try {
    for (const repository of this.scenarioState.repositories ?? []) {
      await repositories.deleteRepository(organization.name, repository.name);
    }

    await organizations.deleteOrganization(organization.name);
  } catch (error) {
    console.error(`Could not delete the seeded organization "${organization.name}":`, error);
  }
});

After(async () => {
  await DriverFactory.quitDriver();
});
