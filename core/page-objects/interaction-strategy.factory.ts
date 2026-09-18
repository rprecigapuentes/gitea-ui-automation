import type { WebDriver } from "selenium-webdriver";
import type { Page } from "@playwright/test";
import type { IInteractionStrategy } from "./interaction-strategy.interface";
import { SeleniumInteractionStrategy } from "./strategies/selenium-interaction.strategy";
import { PlaywrightInteractionStrategy } from "./strategies/playwright-interaction.strategy";

export class InteractionStrategyFactory {
  static selenium(driver: WebDriver): IInteractionStrategy {
    return new SeleniumInteractionStrategy(driver);
  }

  static playwright(page: Page): IInteractionStrategy {
    return new PlaywrightInteractionStrategy(page);
  }
}
