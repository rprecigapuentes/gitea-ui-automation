import { expect, type Locator, type Page } from "@playwright/test";

export class VisualTester {
  async verifyPage(page: Page, name: string): Promise<void> {
    await expect.soft(page).toHaveScreenshot(name);
  }

  async verifyComponent(locator: Locator, name: string): Promise<void> {
    await expect.soft(locator).toHaveScreenshot(name);
  }
}
