import { WebDriver } from "selenium-webdriver";
import { AuthClient } from "@gitea-automation/business-logic/clients/auth.client";

/** Signs in over HTTP and hands the cookies to the browser, skipping the UI login. */
export async function applySession(
  driver: WebDriver,
  authClient: AuthClient,
  username: string,
  password: string,
): Promise<void> {
  const baseUrl = process.env.GITEA_BASE_URL!;
  // Selenium only adds a cookie to the domain the browser is on, so visit it first.
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

  // Reload so the page renders as the signed-in user.
  await driver.navigate().refresh();
}

export async function clearSession(driver: WebDriver): Promise<void> {
  await driver.manage().deleteAllCookies();
}
