import { test, expect } from "../fixtures/fixture";
import { resolveOwnerCredentials } from "../fixtures/credentials";

test.describe("Login via API", () => {
  test("authenticates the browser context using session cookies from AuthClient", async ({
    clients,
    context,
    page,
  }) => {
    const baseUrl = process.env.GITEA_BASE_URL!;
    const { username, password } = resolveOwnerCredentials();
    const userAgent = await page.evaluate(() => navigator.userAgent);

    const cookies = await clients.auth.loginViaApi(username, password, userAgent);

    await context.addCookies(
      cookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        url: baseUrl,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
      })),
    );

    await page.goto("/");

    await expect(page.locator("[data-tooltip-content='Profile and Settings…']")).toBeVisible();
    await expect(page.locator(".text [class=gt-ellipsis]")).toHaveText(username);
  });
});
