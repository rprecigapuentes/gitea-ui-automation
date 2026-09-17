import { test, expect } from "../fixtures/fixture";
import { resolveOwnerCredentials } from "../fixtures/credentials";

test.describe("Login via API", () => {
  test("logs in and out via session cookies issued by AuthClient", async ({
    sessionManager,
    page,
  }) => {
    const { username } = resolveOwnerCredentials();

    await sessionManager.loginAsOwner();

    await expect(page.locator("[data-tooltip-content='Profile and Settings…']")).toBeVisible();
    await expect(page.locator(".text [class=gt-ellipsis]")).toHaveText(username);

    await sessionManager.logout();
    await page.reload();

    await expect(page.locator("[data-tooltip-content='Profile and Settings…']")).toBeHidden();
  });
});
