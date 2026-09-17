import { setWorldConstructor, World } from "@cucumber/cucumber";
import type { WebDriver } from "selenium-webdriver";
import type { ScenarioState } from "@gitea-automation/business-logic-selenium/state/scenario.entity";
import type { OrganizationClient } from "@gitea-automation/business-logic-selenium/api/clients/organizations.client";
import type { PageFactory } from "./page.factory";

export class GiteaWorld extends World {
  driver!: WebDriver;
  scenarioState!: ScenarioState;
  pages!: PageFactory;
  organizationClient!: OrganizationClient;
}

setWorldConstructor(GiteaWorld);
