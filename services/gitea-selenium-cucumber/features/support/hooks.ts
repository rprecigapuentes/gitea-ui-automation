import "dotenv/config";
import { Before, After } from "@cucumber/cucumber";
import { DriverFactory } from "@gitea-automation/core/selenium/drivers/driver.factory";
import type { GiteaWorld } from "./world";

Before(async function (this: GiteaWorld) {
  this.driver = await DriverFactory.getDriver();
});

After(async () => {
  await DriverFactory.quitDriver();
});
