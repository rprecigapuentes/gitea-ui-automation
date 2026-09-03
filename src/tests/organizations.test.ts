import "dotenv/config";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { TestContext } from "../context";
import { DriverFactory } from "../../core/drivers/driver.factory";

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
    const organizationName = `test-orgs-${Date.now()}`;
    const visibility = "public";

    await context.driver.get(context.loginPage.getUrl());
    await context.loginPage.login(username!, password!);

    expect(context.mainPage.getUrl()).toBe(await context.driver.getCurrentUrl());
    await context.mainPage.navigateCreateOrganization();

    expect(context.createOrganizationPage.getUrl()).toBe(await context.driver.getCurrentUrl());
    await context.createOrganizationPage.enterOrganizationName(organizationName);
    await context.createOrganizationPage.selectVisibility(visibility);
    await context.createOrganizationPage.clickCreateOrganizationButton();

    expect(context.organizationPage.getUrl(organizationName)).toBe(
      await context.driver.getCurrentUrl(),
    );
  });
});
