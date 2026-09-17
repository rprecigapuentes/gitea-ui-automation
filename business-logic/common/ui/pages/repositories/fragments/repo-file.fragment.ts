import { BaseComponent } from "@gitea-automation/core-page-objects/base-component";

export class RepoFileFragment extends BaseComponent {
  private organizationName?: string;
  private repositoryName?: string;

  private readonly locators = {
    filesContainer: "#view-file-tree",
    fileName: ".active.section",
    fileContent: ".code-inner",
  };

  // Committing redirects through a loader before this page's own elements exist - confirmed
  // live the whole trip can take several seconds under load, so this gets a generous budget.
  async waitForElements(organizationName: string, repositoryName: string): Promise<boolean> {
    this.organizationName = organizationName;
    this.repositoryName = repositoryName;
    return this.isVisible(
      [this.locators.filesContainer, this.locators.fileName, this.locators.fileContent],
      undefined,
      15000,
    );
  }

  async getFileName(): Promise<string> {
    return this.getText(this.locators.fileName);
  }

  async getFileContent(): Promise<string> {
    return this.getText(this.locators.fileContent);
  }
}
