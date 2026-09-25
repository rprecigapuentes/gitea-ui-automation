// spec: specs/plan.md
// seed: services/playwright-native/tests/seeds/seed.spec.ts

import { test, expect } from "../../fixtures/issues-fixtures";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";

const description =
  "This issue verifies that a title and description are captured correctly when creating an issue.";

test.describe("Create Issue", () => {
  test("Create an issue with a title and a description", async ({
    owner,
    repository,
    pageObjects,
    sessionManager,
  }) => {
    const title = testDataName("CI-HAPPY", "Issue");

    await sessionManager.loginAsOwner();

    // 1. Open the create-issue form of the repository the fixtures created.
    await pageObjects.createIssuePage.openFor(owner, repository);

    // 2. Enter a unique, descriptive title into the Title field.
    await pageObjects.createIssuePage.fillTitle(title);

    // 3. Enter a non-empty description into the description textbox.
    await pageObjects.createIssuePage.fillDescription(description);

    // 4. Submit the form.
    await pageObjects.createIssuePage.submit();

    expect(await pageObjects.issuePage.getTitle()).toBe(title);
    expect(await pageObjects.issuePage.getRenderedBody()).toContain(description);
    expect(await pageObjects.issuePage.getState()).toBe("Open");

    // 5. Open the issue list of that same repository.
    await pageObjects.issueListPage.openFor(owner, repository);
    expect(await pageObjects.issueListPage.getIssueTitles()).toContain(title);
  });
});
