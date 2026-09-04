/* eslint-disable no-empty-pattern */
import "dotenv/config";
import { describe, expect } from "vitest";
import { test as baseTest } from "../src/fixtures/fixture";

const test = baseTest.extend({
  skipAutoLogin: async ({}, use) => {
    await use(true);
  },
});

describe("Login test", () => {
  test("should log in with valid credentials", async ({ driver, loginPage, mainPage }) => {
    await driver.get(loginPage.getUrl());
    await loginPage.login(process.env.GITEA_USERNAME!, process.env.GITEA_PASSWORD!);
    expect(await mainPage.getLoggedInUsername()).toBe(process.env.GITEA_USERNAME!);
  });
});
