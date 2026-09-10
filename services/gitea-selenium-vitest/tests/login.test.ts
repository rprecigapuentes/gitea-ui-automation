import "dotenv/config";
import { describe, expect } from "vitest";
import { test as baseTest } from "../src/fixtures/fixture";
import { resolveOwnerCredentials } from "../src/utils/session-credentials.util";

const test = baseTest.extend({
  skipAutoLogin: async ({}, use) => {
    await use(true);
  },
});

describe("Login test", () => {
  test("should log in with valid credentials", async ({
    driver,
    loginPage,
    mainPage,
    navBarFragment,
  }) => {
    const { username, password } = resolveOwnerCredentials();

    await driver.get(loginPage.getUrl());
    await loginPage.login(username, password);
    expect(await mainPage.isVisible()).toBe(true);
    expect(await navBarFragment.getCurrentOrganization()).toBe(username);
  });
});
