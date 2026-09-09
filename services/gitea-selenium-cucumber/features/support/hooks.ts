import "dotenv/config";
import { Before, After, setDefaultTimeout } from "@cucumber/cucumber";
import { DriverFactory } from "@gitea-automation/core-selenium/ui/drivers/driver.factory";
import type { GiteaWorld } from "./world";

setDefaultTimeout(20000);

Before(async function (this: GiteaWorld) {
  this.driver = await DriverFactory.getDriver();
});

After(async () => {
  await DriverFactory.quitDriver();
});
