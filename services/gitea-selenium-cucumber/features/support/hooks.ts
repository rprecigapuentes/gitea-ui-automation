import "dotenv/config";
import { Before, After, setDefaultTimeout } from "@cucumber/cucumber";
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

export const PROJECT_BOARD_TAG = "@project-board";

const SEEDED_REPOSITORY_COUNT = 2;

// Gitea caps an organization name at 40 characters, so the name stays short while still carrying
// the browser that seeded it and a suffix unique to the scenario.
function seededName(prefix: string): string {
  return `at-${prefix}-${process.env.BROWSER ?? "local"}-${uniqueSuffix()}`;
}

Before(async function (this: GiteaWorld) {
  this.driver = await DriverFactory.getDriver();
  const scenarioState: ScenarioState = {};
  this.scenarioState = scenarioState;
  this.pages = new PageFactory(this.driver);
});

Before({ tags: PROJECT_BOARD_TAG }, async function (this: GiteaWorld) {
  const baseUrl = process.env.GITEA_BASE_URL!;
  const token = resolveOwnerToken();
  const organizationClient = new OrganizationClient(baseUrl, token);
  const repositoryClient = new RepositoryClient(baseUrl, token);
  const issueClient = new IssueClient(baseUrl, token);

  const organizationName = seededName("board");
  await organizationClient.createOrganization(organizationName);
  this.scenarioState.organization = {
    name: organizationName,
    visibility: "private",
    permissions: "true",
  };

  const repositories: SeededRepository[] = [];

  for (let index = 1; index <= SEEDED_REPOSITORY_COUNT; index += 1) {
    const repositoryName = seededName(`repo-${index}`);
    await repositoryClient.createOrganizationRepository(organizationName, repositoryName);

    const title = testDataName("S2-SMK-ISS", `Issue-${index}`);
    const { body: issue } = await issueClient.createIssue(organizationName, repositoryName, title);

    repositories.push({
      name: repositoryName,
      issue: { id: issue.id, number: issue.number, title },
    });
  }

  this.scenarioState.repositories = repositories;
});

After({ tags: PROJECT_BOARD_TAG }, async function (this: GiteaWorld) {
  const organization = this.scenarioState.organization;

  if (!organization) return;

  const baseUrl = process.env.GITEA_BASE_URL!;
  const token = resolveOwnerToken();
  const organizationClient = new OrganizationClient(baseUrl, token);
  const repositoryClient = new RepositoryClient(baseUrl, token);

  // Gitea refuses to delete an organization that still owns repositories, so the repositories go
  // first; the issues and the organization-level projects do go with their owner. A failure here
  // is reported on its own so it cannot replace the scenario's own result.
  try {
    for (const repository of this.scenarioState.repositories ?? []) {
      await repositoryClient.deleteRepository(organization.name, repository.name);
    }

    await organizationClient.deleteOrganization(organization.name);
  } catch (error) {
    console.error(`Could not delete the seeded organization "${organization.name}":`, error);
  }
});

After(async () => {
  await DriverFactory.quitDriver();
});
