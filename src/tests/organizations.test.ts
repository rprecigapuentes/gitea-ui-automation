import "dotenv/config";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { TestContext } from "../context";
import { DriverFactory } from "../../core/drivers/driver.factory";
import { Organization } from "../entities/organization.entity";

const username = process.env.GITEA_USERNAME;
const password = process.env.GITEA_PASSWORD;

describe("Organization test", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await TestContext.create();
    const response = await context.userClient.getUser();
    expect(response.statusCode).toBe(200);
  });

  afterEach(async (ctx) => {
    await context.dispose(ctx.task.name);
  });

  afterAll(async () => {
    await DriverFactory.quitDriver();
  });

  it("should create an organization and add members", async () => {
    const organizationToCreate: Organization = {
      name: `test-orgs-${Date.now()}`,
      visibility: "public",
    };

    //Login page
    await context.driver.get(context.loginPage.getUrl());
    await context.loginPage.login(username!, password!);
    //Main page
    expect(context.mainPage.getUrl()).toBe(await context.driver.getCurrentUrl());
    await context.mainPage.navigateCreateOrganization();
    //Create Organization page
    expect(context.createOrganizationPage.getUrl()).toBe(await context.driver.getCurrentUrl());
    await context.createOrganizationPage.enterOrganizationName(organizationToCreate.name);
    await context.createOrganizationPage.selectVisibility(organizationToCreate.visibility);
    await context.createOrganizationPage.clickCreateOrganizationButton();
    context.organization = organizationToCreate;
    //Organization Dashboard Page
    expect(context.organizationDashboardPage.getUrl()).toBe(await context.driver.getCurrentUrl());
    await context.organizationDashboardPage.clickViewRepositoryButton();

    //Org repositories page
    expect(context.organizationRepositoriesPage.getUrl()).toBe(
      await context.driver.getCurrentUrl(),
    );
    await context.organizationRepositoriesPage.navigateToTeams();

    //Org teams page
    expect(context.organizationTeamsPage.getUrl()).toBe(await context.driver.getCurrentUrl());
  });
});
