import { By } from "selenium-webdriver";
import { BaseComponent } from "./base-component";

export interface Navigable {
  getUrl(...args: unknown[]): string;
  open(readyLocators?: By[], ...args: unknown[]): Promise<void>;
}

export abstract class BasePage extends BaseComponent implements Navigable {
  abstract getUrl(...args: unknown[]): string;

  async open(readyLocators: By[] = [], ...args: unknown[]): Promise<void> {
    if (readyLocators.length === 0) {
      await this.driver.get(this.getUrl(...args));
      return;
    }

    await this.actAndWaitFor(() => this.driver.get(this.getUrl(...args)), readyLocators);
  }
}
