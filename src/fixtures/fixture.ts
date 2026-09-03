/* eslint-disable no-empty-pattern */
import { test as base, expect } from "vitest";
import { UserClient } from "../api/clients/user.client";
import { OrganizationClient } from "../api/clients/organizations.client";
import { Organization } from "../entities/organization.entity";
import { WebDriver } from "selenium-webdriver";
import { DriverFactory } from "../../core/drivers/driver.factory";
import { LoginPage } from "../pages/login.page";
import { MainPage } from "../pages/main.page";
import { CreateOrganizationPage } from "../pages/create-organization.page";
import { OrganizationDashboardPage } from "../pages/organization-dashboard.page";
import { OrganizationRepositoriesPage } from "../pages/organization-repositories.page";
import { OrganizationTeamsPage } from "../pages/organization-teams.page";
import { NewTeamPage } from "../pages/new-team-organization.page";
import { SpecificTeamPage } from "../pages/specific-team.page";
import { Team } from "../entities/teams.entity";

interface ScenarioState {
  team?: Team;
  organization?: Organization;
}

interface CustomFixtures {
  driver: WebDriver;
  scenarioState: ScenarioState;
  //clients
  userClient: UserClient;
  organizationClient: OrganizationClient;
  //pages
  loginPage: LoginPage;
  mainPage: MainPage;
  createOrganizationPage: CreateOrganizationPage;
  organizationPages: {
    dashboard: () => OrganizationDashboardPage;
    repositories: () => OrganizationRepositoriesPage;
    teams: () => OrganizationTeamsPage;
    newTeam: () => NewTeamPage;
    specificTeam: () => SpecificTeamPage;
  };
  cleanupOrganizations: void;
}

export const test = base.extend<CustomFixtures>({
  driver: [
    async ({}, use) => {
      const driver = await DriverFactory.getDriver();
      await use(driver);
      await DriverFactory.quitDriver();
    },
    { scope: "file" },
  ],
  scenarioState: async ({}, use) => {
    const scenarioState: ScenarioState = {};
    await use(scenarioState);
  },
  userClient: async ({}, use) => {
    const userClient = new UserClient(process.env.GITEA_BASE_URL!, process.env.GITEA_TOKEN!);
    await use(userClient);
  },
  organizationClient: async ({}, use) => {
    const organizationClient = new OrganizationClient(
      process.env.GITEA_BASE_URL!,
      process.env.GITEA_TOKEN!,
    );
    await use(organizationClient);
  },
  loginPage: async ({ driver }, use) => {
    const loginPage = new LoginPage(driver);
    await use(loginPage);
  },
  mainPage: async ({ driver }, use) => {
    const mainPage = new MainPage(driver);
    await use(mainPage);
  },
  createOrganizationPage: async ({ driver }, use) => {
    const createOrganizationPage = new CreateOrganizationPage(driver);
    await use(createOrganizationPage);
  },
  organizationPages: async ({ driver, scenarioState }, use) => {
    const requireOrganization = (): Organization => {
      if (!scenarioState.organization) {
        throw new Error("organization is not set in scenarioState");
      }
      return scenarioState.organization;
    };
    const requireTeam = (): Team => {
      requireOrganization(); // un team no puede existir sin organización — si falla, el mensaje de arriba explica por qué
      if (!scenarioState.team) {
        throw new Error("team is not set in scenarioState — créalo antes de acceder a sus páginas");
      }
      return scenarioState.team;
    };

    await use({
      dashboard: () => new OrganizationDashboardPage(driver, requireOrganization()),
      repositories: () => new OrganizationRepositoriesPage(driver, requireOrganization()),
      teams: () => new OrganizationTeamsPage(driver, requireOrganization()),
      newTeam: () => new NewTeamPage(driver, requireOrganization()),
      specificTeam: () => new SpecificTeamPage(driver, requireOrganization(), requireTeam()),
    });
  },
  cleanupOrganizations: [
    async ({ organizationClient, task }, use) => {
      await use();
      console.log(`Cleaning data for test: ${task.name}`);
      const response = await organizationClient.getAllOrganizations();
      expect(response.statusCode).toBe(200);
      const orgs = response.body;
      await Promise.all(orgs.map((org) => organizationClient.deleteOrganization(org.name)));
    },
    { auto: true },
  ],
});
