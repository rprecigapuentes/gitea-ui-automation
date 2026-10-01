import { BaseComponent } from "./base-component";

export interface Navigable {
  getUrl(...args: unknown[]): string;
  open(readyLocators?: string[], ...args: unknown[]): Promise<void>;
}

export abstract class BasePage extends BaseComponent implements Navigable {
  abstract getUrl(...args: unknown[]): string;

  /** `readyLocators` prove the page rendered; `args` are passed through to `getUrl`. */
  async open(readyLocators: string[] = [], ...args: unknown[]): Promise<void> {
    await this.strategy.open(this.getUrl(...args), readyLocators);
  }

  /** Regions whose content changes between runs; visual tests mask them. A page overrides it. */
  getVolatileRegions(): string[] {
    return [];
  }
}
