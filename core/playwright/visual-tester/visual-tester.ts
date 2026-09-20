import { expect, type Locator, type Page } from "@playwright/test";

export interface VisualOptions {
  /** Selectors of the regions painted over before comparing, added to the tester's defaults. */
  mask?: string[];
}

export class VisualTester {
  constructor(private readonly defaultMask: string[] = []) {}

  async verifyPage(page: Page, name: string, options: VisualOptions = {}): Promise<void> {
    await expect.soft(page).toHaveScreenshot(name, { mask: this.masksFor(page, options.mask) });
  }

  async verifyComponent(
    locator: Locator,
    name: string,
    options: VisualOptions = {},
  ): Promise<void> {
    await expect
      .soft(locator)
      .toHaveScreenshot(name, { mask: this.masksFor(locator.page(), options.mask) });
  }

  private masksFor(page: Page, extra: string[] = []): Locator[] {
    return [...this.defaultMask, ...extra].map((selector) => page.locator(selector));
  }
}
