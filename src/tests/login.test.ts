import "dotenv/config";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { TestContext } from "../context";
import { DriverFactory } from "../../core/drivers/driver.factory";

const username = process.env.GITEA_USERNAME;
const password = process.env.GITEA_PASSWORD;

describe("Login test", () => {
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

  it("should log in with valid credentials", async () => {
    await context.driver.get(context.loginPage.getUrl());
    await context.loginPage.login(username!, password!);
    const actualUsername = await context.mainPage.getLoggedInUsername();

    expect(actualUsername).toBe(username);
  });
});
