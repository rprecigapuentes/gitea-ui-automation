import { test, expect } from "../fixtures/fixture";
import { resolveOwnerCredentials } from "../fixtures/credentials";

test.describe("Login via UI", () => {
  test("fills the login form and submits it", async ({ pageObjects }) => {
    const { username, password } = resolveOwnerCredentials();

    await pageObjects.loginPage.open();
    await pageObjects.loginPage.login(username, password);

    expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
    expect(await pageObjects.navBar.getCurrentOrganization()).toBe(username);
  });
});
