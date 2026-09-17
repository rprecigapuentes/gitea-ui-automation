import { BaseComponent } from "./base-component";

export interface Navigable {
  getUrl(...args: unknown[]): string;
  open(readyLocators?: string[], ...args: unknown[]): Promise<void>;
}

export abstract class BasePage extends BaseComponent implements Navigable {
  abstract getUrl(...args: unknown[]): string;

  async open(readyLocators: string[] = [], ...args: unknown[]): Promise<void> {
    await this.strategy.open(this.getUrl(...args), readyLocators);
  }
}
