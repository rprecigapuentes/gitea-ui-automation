import { test, expect } from "../fixtures/fixture";
import { resolveOwnerCredentials } from "@gitea-automation/shared-playwright/credentials";

test.describe("Login via UI", () => {
  test("fills the login form and submits it", async ({ pageObjects }, testInfo) => {
    const { username, password } = resolveOwnerCredentials(testInfo.project.name);

    await pageObjects.loginPage.open();
    await pageObjects.loginPage.login(username, password);

    expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
    expect(await pageObjects.navBar.getCurrentOrganization()).toBe(username);
  });
});
