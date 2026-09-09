import "dotenv/config";
import { Before, After, setDefaultTimeout } from "@cucumber/cucumber";
import { DriverFactory } from "@gitea-automation/core-selenium/ui/drivers/driver.factory";
import type { ScenarioState } from "@gitea-automation/business-logic-selenium/state/scenario.entity";
import { PageFactory } from "./page.factory";
import type { GiteaWorld } from "./world";

setDefaultTimeout(20000);

Before(async function (this: GiteaWorld) {
  this.driver = await DriverFactory.getDriver();
  const scenarioState: ScenarioState = {};
  this.scenarioState = scenarioState;
  this.pages = new PageFactory(this.driver);
});

After(async () => {
  await DriverFactory.quitDriver();
});
