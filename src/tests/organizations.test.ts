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

  afterEach((ctx) => {
    context.dispose(ctx.task.name);
  });

  afterAll(async () => {
    await DriverFactory.quitDriver();
  });

  it("should create an organization and add members", async () => {
    await context.driver.get(context.loginPage.baseUrl);
    await context.loginPage.login(username!, password!);
    await context.mainPage.navigateCreateOrganization();
    const formTitle = await context.createOrganizationPage.getFormTitle();

    expect(formTitle).toBe("New Organization");
  });
});
