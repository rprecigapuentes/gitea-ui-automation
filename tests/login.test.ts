import "dotenv/config";
import { describe, expect } from "vitest";
import { test as it } from "../src/fixtures/fixture";

describe("Login test", () => {
  it("should log in with valid credentials", async ({ driver, loginPage, mainPage }) => {
    await driver.get(loginPage.getUrl());
    await loginPage.login(process.env.GITEA_USERNAME!, process.env.GITEA_PASSWORD!);
    expect(await mainPage.getLoggedInUsername()).toBe(process.env.GITEA_USERNAME!);
  });
});
