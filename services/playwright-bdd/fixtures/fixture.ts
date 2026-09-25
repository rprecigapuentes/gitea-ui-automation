import { createBdd, test as base } from "playwright-bdd";
import type { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { InteractionStrategyFactory } from "@gitea-automation/core-page-objects/interaction-strategy.factory";
import { PageFactory } from "@gitea-automation/business-logic/pages/page.factory";
import type { ScenarioState } from "@gitea-automation/business-logic/state/scenario.entity";
import { resolveOwnerCredentials, type Credentials } from "./credentials";

interface CustomFixtures {
  strategy: IInteractionStrategy;
  pageObjects: PageFactory;
  scenarioState: ScenarioState;
  ownerCredentials: Credentials;
}

export const test = base.extend<CustomFixtures>({
  strategy: async ({ page }, use) => {
    await use(InteractionStrategyFactory.playwright(page));
  },
  scenarioState: async ({}, use) => {
    const scenarioState: ScenarioState = {};
    await use(scenarioState);
  },
  pageObjects: async ({ strategy, scenarioState }, use) => {
    await use(new PageFactory(strategy, scenarioState));
  },
  ownerCredentials: async ({}, use, testInfo) => {
    await use(resolveOwnerCredentials(testInfo.project.name));
  },
});

export { expect } from "@playwright/test";

export const { Given, When, Then } = createBdd(test);
