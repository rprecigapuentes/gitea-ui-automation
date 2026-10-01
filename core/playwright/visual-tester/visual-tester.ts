import { expect, type Locator, type Page } from "@playwright/test";

export interface VisualOptions {
  /** Selectors of the regions painted over before comparing, added to the tester's defaults. */
  mask?: string[];
  /** Maximum number of differing pixels tolerated; omit for an exact match. Each spec's value was
   *  set in a commit of its own: `git log -S"maxDiffPixels: <n>"` finds the one behind a number. */
  maxDiffPixels?: number;
}

/** Soft assertions: a mismatch is reported at the end of the test, so one run lists every view. */
export class VisualTester {
  constructor(private readonly defaultMask: string[] = []) {}

  async verifyPage(page: Page, name: string, options: VisualOptions = {}): Promise<void> {
    await expect.soft(page).toHaveScreenshot(name, {
      mask: this.masksFor(page, options.mask),
      maxDiffPixels: options.maxDiffPixels,
    });
  }

  async verifyComponent(
    locator: Locator,
    name: string,
    options: VisualOptions = {},
  ): Promise<void> {
    await expect.soft(locator).toHaveScreenshot(name, {
      mask: this.masksFor(locator.page(), options.mask),
      maxDiffPixels: options.maxDiffPixels,
    });
  }

  private masksFor(page: Page, extra: string[] = []): Locator[] {
    return [...this.defaultMask, ...extra].map((selector) => page.locator(selector));
  }
}
