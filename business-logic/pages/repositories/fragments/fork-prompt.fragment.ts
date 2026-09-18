import { BaseComponent } from "@gitea-automation/core-page-objects/base-component";

export class ForkPromptFragment extends BaseComponent {
  private readonly locators = {
    heading: "h3",
    forkButton: ".ui.primary.button",
  };

  async waitForElements(): Promise<boolean> {
    return this.isVisible([this.locators.heading, this.locators.forkButton]);
  }

  async getHeadingText(): Promise<string> {
    return this.getText(this.locators.heading);
  }
}
