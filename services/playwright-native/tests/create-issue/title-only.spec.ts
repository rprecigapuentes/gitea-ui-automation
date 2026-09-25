// spec: specs/create-issue.plan.md
// seed: services/playwright-native/tests/seed.spec.ts

import { test, expect } from "../../fixtures/fixture";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";
import { resolveOwnerCredentials } from "../../fixtures/credentials";

const OWNER = "chrome-owner";
const REPO = "agent-baseline";

test.describe("Create Issue", () => {
  test("Create an issue with a title only", async ({ pageObjects }, testInfo) => {
    const { username, password } = resolveOwnerCredentials(testInfo.project.name);
    const title = testDataName("CI-02", "Issue");

    // 1. Navigate to http://localhost:3000/user/login
    await pageObjects.loginPage.open();
    expect(await pageObjects.loginPage.hasExpectedFormElements()).toBe(true);

    // 2. Log in as the repository owner and submit the Sign In form
    await pageObjects.loginPage.login(username, password);
    expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
    expect(await pageObjects.navBar.waitForElements()).toBe(true);
    expect(await pageObjects.navBar.getCurrentUsername()).toBe(username);

    // 3. Navigate to http://localhost:3000/chrome-owner/agent-baseline/issues/new
    await pageObjects.createIssuePage.openFor(OWNER, REPO);

    // 4. Enter a unique, descriptive title into the Title field and leave the description textbox empty
    await pageObjects.createIssuePage.fillTitle(title);

    // 5. Click the Create Issue button
    await pageObjects.createIssuePage.submit();

    expect(await pageObjects.issuePage.getTitle()).toBe(title);
    expect(await pageObjects.issuePage.hasNoDescription()).toBe(true);
    expect(await pageObjects.issuePage.getState()).toBe("Open");
  });
});
