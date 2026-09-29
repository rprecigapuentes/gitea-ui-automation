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
  // Kept out of the pipeline, not deleted: gitea-selenium-cucumber's login.feature already
  // exercises this exact flow, and playwright-native and playwright-bdd each carry their own.
  test.skip("should log in with valid credentials", async ({
    driver,
    loginPage,
    mainPage,
    navBarFragment,
  }) => {
    const { username, password } = resolveOwnerCredentials();

    await driver.get(loginPage.getUrl());
    await loginPage.login(username, password);
    expect(await mainPage.hasExpectedElementsDisplayed()).toBe(true);
    expect(await navBarFragment.getCurrentOrganization()).toBe(username);
  });
});
