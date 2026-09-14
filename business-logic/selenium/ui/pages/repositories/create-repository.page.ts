import { By } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";

export class CreateRepositoryPage extends BasePage {
  private readonly locators = {
    //form container
    formContainer: By.css(".ui.container.medium-width"),
    //form Inputs
    repoOwnerDropdown: By.css("#repo_owner_dropdown"),
    repositoryNameInput: By.css("#repo_name"),
    repositoryVisibilityCheckbox: By.css("[name=private]"),
    //form buttons
    createRepositoryButton: By.css(".ui.primary.button"),
  };

  getUrl(): string {
    throw new Error("Method not implemented.");
  }

  async waitForElements(): Promise<void> {
    const ready = [
      this.locators.formContainer,
      this.locators.repoOwnerDropdown,
      this.locators.repositoryNameInput,
      this.locators.repositoryVisibilityCheckbox,
      this.locators.createRepositoryButton,
    ];
    await this.isVisible(ready);
  }

  async enterRepositoryName(name: string): Promise<void> {
    await this.type(this.locators.repositoryNameInput, name);
  }

  async setPrivate(isPrivate: boolean): Promise<void> {
    const checkbox = await this.findElement(this.locators.repositoryVisibilityCheckbox);
    if ((await checkbox.isSelected()) !== isPrivate) {
      await checkbox.click();
    }
  }

  async clickCreateRepositoryButton(): Promise<void> {
    await this.click(this.locators.createRepositoryButton);
  }
}
