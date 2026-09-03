import "dotenv/config";
import { describe, expect } from "vitest";
import { Organization } from "../entities/organization.entity";
import type { Team } from "../entities/teams.entity";
import { test as it } from "../fixtures/fixture";

const username = process.env.GITEA_USERNAME;
const password = process.env.GITEA_PASSWORD;

describe("Organization test", () => {
  it("should create an organization and add members", async ({
    driver,
    organizationPages,
    scenarioState,
    loginPage,
    mainPage,
    createOrganizationPage,
  }) => {
    const organizationToCreate: Organization = {
      name: `test-orgs-${Date.now()}`,
      visibility: "public",
    };
    const teamToCreate: Team = {
      name: "test-team",
      description: "This is a test team",
      visibility: "public",
      permission: "read",
      includes_all_repositories: true,
      can_create_org_repo: false,
    };
    //login Page
    await driver.get(loginPage.getUrl());
    await loginPage.login(username!, password!);
    expect(mainPage.getUrl()).toBe(await driver.getCurrentUrl());
    //main page
    await mainPage.navigateCreateOrganization();
    expect(createOrganizationPage.getUrl()).toBe(await driver.getCurrentUrl());
    //Create Organization page
    await createOrganizationPage.enterOrganizationName(organizationToCreate.name);
    await createOrganizationPage.selectVisibility(organizationToCreate.visibility);
    await createOrganizationPage.clickCreateOrganizationButton();
    scenarioState.organization = organizationToCreate;
    expect(organizationPages.dashboard().getUrl()).toBe(await driver.getCurrentUrl());
    //Organization Dashboard Page
    await organizationPages.dashboard().clickViewRepositoryButton();
    expect(organizationPages.repositories().getUrl()).toBe(await driver.getCurrentUrl());
    //Organization Repositories Page
    await organizationPages.repositories().navigateToTeams();
    expect(organizationPages.teams().getUrl()).toBe(await driver.getCurrentUrl());
    //Organization Teams Page
    await organizationPages.teams().clickNewTeamButton();
    expect(organizationPages.newTeam().getUrl()).toBe(await driver.getCurrentUrl());
    //New team page
    await organizationPages.newTeam().enterTeamName(teamToCreate.name);
    await organizationPages.newTeam().selectVisibility(teamToCreate.visibility);
    await organizationPages.newTeam().clickCreateTeamButton();
    scenarioState.team = teamToCreate;
    expect(organizationPages.specificTeam().getUrl()).toBe(await driver.getCurrentUrl());
  });
});
