import { By } from "selenium-webdriver";
import { BaseComponent } from "./base-component.alt";

export interface Navigable {
  getUrl(...args: unknown[]): string;
  open(readyLocators?: By[], ...args: unknown[]): Promise<void>;
}

// readyLocators moved from an overridable getReadyLocators() to an explicit parameter here —
// same reasoning as isVisible: what to wait for after navigating is a decision each call makes,
// not a fixed property of the page class. Pages that don't need to wait for anything just call
// open() with no arguments, same as today.
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
