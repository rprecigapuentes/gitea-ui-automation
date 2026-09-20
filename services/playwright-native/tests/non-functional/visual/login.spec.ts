import { test } from "../../../fixtures/visual.fixture";

test.describe("Visual Testing: Login Page", () => {
  test("Login page matches its baseline", async ({ pageObjects, page, visualTester }) => {
    await pageObjects.loginPage.open();
    await visualTester.verifyPage(page, "login-page.png"); //this the assertion for visual regression
  });
});
