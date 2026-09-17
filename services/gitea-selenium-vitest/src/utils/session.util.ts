import { WebDriver } from "selenium-webdriver";
import { AuthClient } from "@gitea-automation/business-logic-api/api/clients/auth.client";

export async function applySession(
  driver: WebDriver,
  authClient: AuthClient,
  username: string,
  password: string,
): Promise<void> {
  const baseUrl = process.env.GITEA_BASE_URL!;
  await driver.get(baseUrl);

  const browserUserAgent = await driver.executeScript("return navigator.userAgent;");
  const cookies = await authClient.loginViaApi(username, password, browserUserAgent as string);

  await driver.manage().deleteAllCookies();
  for (const cookie of cookies) {
    await driver.manage().addCookie({
      name: cookie.name,
      value: cookie.value,
      path: cookie.path || "/",
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
    });
  }

  await driver.navigate().refresh();
}

export async function clearSession(driver: WebDriver): Promise<void> {
  await driver.manage().deleteAllCookies();
}
