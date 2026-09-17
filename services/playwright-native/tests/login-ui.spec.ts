import { test, expect } from "../fixtures/fixture";
import { resolveOwnerCredentials } from "../fixtures/credentials";

test.describe("Login via UI", () => {
  test("fills the login form and submits it", async ({ strategy, pages, page }) => {
    const { username, password } = resolveOwnerCredentials();

    await page.goto(pages.loginPage.getUrl());
    await strategy.type("#user_name", username);
    await strategy.type("#password", password);
    await strategy.click("form button");
    await page.waitForURL(/^https?:\/\/[^/]+\/(\?.*)?$/);

    await expect(page.locator("[data-tooltip-content='Profile and Settings…']")).toBeVisible();
    await expect(page.locator(".text [class=gt-ellipsis]")).toHaveText(username);
  });
});
