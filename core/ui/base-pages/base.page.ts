import { BaseComponent } from "./base-component";

export interface Navigable {
  getUrl(...args: unknown[]): string;
  open(...args: unknown[]): Promise<void>;
}

export abstract class BasePage extends BaseComponent implements Navigable {
  abstract getUrl(...args: unknown[]): string;

  async open(...args: unknown[]): Promise<void> {
    await this.driver.get(this.getUrl(...args));
  }
}
