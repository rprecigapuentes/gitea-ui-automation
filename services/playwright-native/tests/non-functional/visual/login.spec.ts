import { resolveOwnerCredentials } from "../../../fixtures/credentials";
import { expect, test } from "../../../fixtures/visual.fixture";

test.describe("Visual Testing: Login Page", () => {
  test("Login page matches its baseline", async ({ pageObjects, page, visualTester }, testInfo) => {
    const { username, password } = resolveOwnerCredentials(testInfo.project.name);

    await pageObjects.loginPage.open();
    await visualTester.verifyPage(page, "login-page.png", {
      mask: pageObjects.loginPage.getVolatileRegions(),
    });
    await pageObjects.loginPage.login(username, password);

    expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
    expect(await pageObjects.navBar.getCurrentOrganization()).toBe(username);
    await visualTester.verifyPage(page, "main.png");
  });
});
