// spec: specs/create-issue.plan.md
// seed: services/playwright-native/tests/seed.spec.ts

import { test, expect } from "@playwright/test";

const OWNER = "chrome-owner";
const REPO = "agent-baseline";

test.describe("Create Issue", () => {
  test("Create an issue with a title and a description", async ({ page }) => {
    const username = process.env.GITEA_OWNER_CHROME!;
    const password = process.env.GITEA_OWNER_CHROME_PASSWORD!;
    const title = `Automated happy-path issue creation test ${Date.now()}`;
    const description =
      "This issue was created by the automated happy-path Playwright test to verify the create issue workflow end to end.";

    // 1. Navigate to http://localhost:3000/user/login
    await page.goto("/user/login");
    await expect(page.getByRole("textbox", { name: "Username or Email Address *" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();

    // 2. Log in with the username and password from .env, then submit the Sign In form
    await page.getByRole("textbox", { name: "Username or Email Address *" }).fill(username);
    await page.getByRole("textbox", { name: "Password" }).fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("img", { name: username }).first()).toBeVisible();

    // 3. Navigate to http://localhost:3000/chrome-owner/agent-baseline/issues/new
    await page.goto(`/${OWNER}/${REPO}/issues/new`);
    const titleField = page.getByRole("textbox", { name: "Title" });
    const descriptionField = page.getByRole("textbox", { name: "Leave a comment" });
    await expect(titleField).toBeVisible();
    await expect(descriptionField).toBeVisible();
    await expect(page.getByText("Write", { exact: true })).toBeVisible();
    await expect(page.getByText("Preview", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Issue" })).toBeVisible();

    // 4. Enter a unique, descriptive title into the Title field
    await titleField.fill(title);

    // 5. Enter a non-empty description into the description textbox
    await descriptionField.fill(description);

    // 6. Click the 'Create Issue' button
    await page.getByRole("button", { name: "Create Issue" }).click();

    await expect(page).toHaveURL(new RegExp(`/${OWNER}/${REPO}/issues/\\d+$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
    await expect(page.getByRole("article").first()).toContainText(description);
    await expect(page.getByText("Open", { exact: true }).first()).toBeVisible();

    // 7. Navigate to http://localhost:3000/chrome-owner/agent-baseline/issues
    await page.goto(`/${OWNER}/${REPO}/issues`);
    await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();
  });
});
