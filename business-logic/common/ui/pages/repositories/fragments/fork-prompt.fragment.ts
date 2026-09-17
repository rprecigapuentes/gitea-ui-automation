import { By } from "selenium-webdriver";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";

export class ForkPromptFragment extends BaseComponent {
  private readonly locators = {
    heading: By.css("h3"),
    forkButton: By.css(".ui.primary.button"),
  };

  async waitForElements(): Promise<boolean> {
    return this.isVisible([this.locators.heading, this.locators.forkButton]);
  }

  async getHeadingText(): Promise<string> {
    return this.getText(this.locators.heading);
  }
}
