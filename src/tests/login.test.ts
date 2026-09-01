import "dotenv/config";
import { describe, it } from "vitest";
import { WebDriver } from "selenium-webdriver";
import { createDriver } from "../drivers/driver.factory";
import { LoginPage } from "../pages/login.page";

const username = process.env.GITEA_USERNAME;
const password = process.env.GITEA_PASSWORD;

if (!username || !password) {
  throw new Error(
    "GITEA_USERNAME and GITEA_PASSWORD must be configured in the .env file.",
  );
}

describe("Login test", () => {
  let driver: WebDriver;
  let loginPage: LoginPage;
  beforeEach(async () => {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
  });

  afterEach(async () => {
    await driver.quit();
  });

  it("should log in with valid credentials", async () => {
    await driver.get(loginPage.baseUrl);
    await loginPage.login(username, password);
    console.log("Login successful");
  });
});