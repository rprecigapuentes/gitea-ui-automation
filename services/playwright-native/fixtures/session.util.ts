import type { BrowserContext, Page } from "@playwright/test";
import { AuthClient } from "@gitea-automation/business-logic-api/api/clients/auth.client";

export async function applySession(
  context: BrowserContext,
  page: Page,
  authClient: AuthClient,
  username: string,
  password: string,
): Promise<void> {
  const baseUrl = process.env.GITEA_BASE_URL!;
  const userAgent = await page.evaluate(() => navigator.userAgent);
  const cookies = await authClient.loginViaApi(username, password, userAgent);

  await context.clearCookies();
  await context.addCookies(
    cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      url: baseUrl,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
    })),
  );

  await page.goto(baseUrl);
}

export async function clearSession(context: BrowserContext): Promise<void> {
  await context.clearCookies();
}
