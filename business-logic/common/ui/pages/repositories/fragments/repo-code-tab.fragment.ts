import { BaseComponent } from "@gitea-automation/core-page-objects/base-component";

export class RepoCodeTabFragment extends BaseComponent {
  private organizationName?: string;
  private repositoryName?: string;

  private readonly locators = {
    // code tab container
    codeTabContainer: ".sixteen.wide.column.content",
    filesContainer: "#repo-files-table",
    fileRow: ".repo-file-item",
    // Once the repo has a file, "New File" moves from a direct link into this dropdown.
    addFileDropdownButton: ".repo-add-file",
  };

  // The button's only real identifier is its href (/{org}/{repo}/_new/{branch}/) - its class
  // is too generic to select on its own.
  private newFileButtonLocator(): string {
    return `a[href^="/${this.organizationName}/${this.repositoryName}/_new/"]`;
  }

  async waitForElements(organizationName: string, repositoryName: string): Promise<boolean> {
    this.organizationName = organizationName;
    this.repositoryName = repositoryName;

    if (!(await this.isVisible(this.locators.codeTabContainer))) return false;

    const directLinkVisible = await this.isVisible(this.newFileButtonLocator(), undefined, 0);
    const dropdownVisible = await this.isVisible(this.locators.addFileDropdownButton, undefined, 0);
    return directLinkVisible || dropdownVisible;
  }

  async clickNewFileButton(): Promise<void> {
    const dropdownVisible = await this.isVisible(this.locators.addFileDropdownButton, undefined, 0);
    if (dropdownVisible) {
      await this.clickAndWaitFor(this.locators.addFileDropdownButton, [
        this.newFileButtonLocator(),
      ]);
    }
    await this.click(this.newFileButtonLocator());
  }

  async getFilesCount(): Promise<number> {
    const container = await this.findElement(this.locators.filesContainer);
    const rows = await this.findElements(this.locators.fileRow, container);
    return rows.length;
  }
}
