import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { WebDriver } from "selenium-webdriver";
import { createDriver } from "../drivers/driver.factory";

describe("Google test", () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver();
  }, 60000);

  afterAll(async () => {
    await driver?.quit();
  });

  it("Load page and validate the title", async () => {
    await driver.get("https://www.google.com");
    const title = await driver.getTitle();
    expect(title).toContain("Google");
  }, 20000);
});