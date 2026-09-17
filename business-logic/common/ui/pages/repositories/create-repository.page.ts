import { BasePage } from "@gitea-automation/core-page-objects/base.page";

export class CreateRepositoryPage extends BasePage {
  private readonly locators = {
    //form container
    formContainer: ".ui.container.medium-width",
    //form Inputs
    repoOwnerDropdown: "#repo_owner_dropdown",
    repositoryNameInput: "#repo_name",
    repositoryVisibilityCheckbox: "[name=private]",
    //form buttons
    createRepositoryButton: ".ui.primary.button",
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

  async createRepository(name: string, isPrivate: boolean): Promise<void> {
    await this.enterRepositoryName(name);
    await this.setPrivate(isPrivate);
    await this.clickCreateRepositoryButton();
  }
}
