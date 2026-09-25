// spec: openspec/specs/page-objects/spec.md
// seed: services/playwright-native/tests/seeds/anonymous.spec.ts

import { test, expect } from "../../fixtures/fixture";
import { resolveOwnerCredentials } from "../../fixtures/credentials";

test.describe("Sign in", () => {
  test("An owner signs in through the form and reaches the dashboard", async ({
    pageObjects,
  }, testInfo) => {
    const { username, password } = resolveOwnerCredentials(testInfo.project.name);

    // 1. Open the sign-in form.
    await pageObjects.loginPage.open();

    // The username field, the password field and the sign-in button are visible.
    expect(await pageObjects.loginPage.hasExpectedFormElements()).toBe(true);

    // 2. Enter this browser's owner username and password, and submit the form.
    await pageObjects.loginPage.login(username, password);

    // The dashboard renders with the elements it is expected to carry.
    expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);

    // The navigation bar reports the signed-in account as that same username.
    expect(await pageObjects.navBar.getCurrentOrganization()).toBe(username);
  });
});
