// spec: specs/create-issue.plan.md
// seed: services/playwright-native/tests/seed.spec.ts

import { test, expect } from "../../fixtures/fixture";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";
import { resolveOwnerCredentials } from "../../fixtures/credentials";

const OWNER = "chrome-owner";
const REPO = "agent-baseline";
const description =
  "This issue was created by the OpenSpec-driven Playwright test to verify the create issue workflow end to end.";

test.describe("Create Issue", () => {
  test("Create an issue with a title and a description", async ({ pageObjects }, testInfo) => {
    const { username, password } = resolveOwnerCredentials(testInfo.project.name);
    const title = testDataName("CI-01", "Issue");

    // 1. Navigate to http://localhost:3000/user/login
    await pageObjects.loginPage.open();
    expect(await pageObjects.loginPage.hasExpectedFormElements()).toBe(true);

    // 2. Log in with the username and password from .env, then submit the Sign In form
    await pageObjects.loginPage.login(username, password);
    expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
    expect(await pageObjects.navBar.waitForElements()).toBe(true);
    expect(await pageObjects.navBar.getCurrentUsername()).toBe(username);

    // 3. Navigate to http://localhost:3000/chrome-owner/agent-baseline/issues/new
    await pageObjects.createIssuePage.openFor(OWNER, REPO);

    // 4. Enter a unique, descriptive title into the Title field
    await pageObjects.createIssuePage.fillTitle(title);

    // 5. Enter a non-empty description into the description textbox
    await pageObjects.createIssuePage.fillDescription(description);

    // 6. Click the 'Create Issue' button
    await pageObjects.createIssuePage.submit();

    expect(await pageObjects.issuePage.getTitle()).toBe(title);
    expect(await pageObjects.issuePage.getRenderedBody()).toContain(description);
    expect(await pageObjects.issuePage.getState()).toBe("Open");

    // 7. Navigate to http://localhost:3000/chrome-owner/agent-baseline/issues
    await pageObjects.issueListPage.openFor(OWNER, REPO);
    expect(await pageObjects.issueListPage.getIssueTitles()).toContain(title);
  });
});
