import "dotenv/config";
import { describe, expect, it } from "vitest";
import { WebDriver } from "selenium-webdriver";
import { DriverFactory } from "../../core/drivers/driver.factory";
import { LoginPage } from "../pages/login.page";

const username = process.env.GITEA_USERNAME;
const password = process.env.GITEA_PASSWORD;

describe("Login test", () => {
  let driver: WebDriver;
  let loginPage: LoginPage;

  beforeEach(async () => {
    driver = await DriverFactory.getDriver();
    loginPage = new LoginPage(driver);
  });

  afterEach(async () => {
    await DriverFactory.quitDriver();
  });

  it("should log in with valid credentials", async () => {
    await driver.get(loginPage.baseUrl);
    const mainPage = await loginPage.login(username!, password!);

    expect(await mainPage.getLoggedInUsername()).toBe(username);
  });
});
