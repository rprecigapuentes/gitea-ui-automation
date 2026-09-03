/* eslint-disable no-empty-pattern */
import { test as base } from "vitest";
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

interface ScenarioState {
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

    await use({
      dashboard: () => new OrganizationDashboardPage(driver, requireOrganization()),
      repositories: () => new OrganizationRepositoriesPage(driver, requireOrganization()),
      teams: () => new OrganizationTeamsPage(driver, requireOrganization()),
    });
  },
  cleanupOrganizations: [
    async ({ organizationClient, task }, use) => {
      await use();
      const response = await organizationClient.getAllOrganizations();
      expect(response.statusCode).toBe(200);
      const orgs = response.body;
      await Promise.all(orgs.map((org) => organizationClient.deleteOrganization(org.name)));
      console.log(`Cleaning data for test: ${task.name}`);
    },
    { auto: true },
  ],
});
