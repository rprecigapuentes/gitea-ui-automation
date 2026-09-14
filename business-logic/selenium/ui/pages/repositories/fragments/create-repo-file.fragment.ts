// organization-base.page.ts
import { By } from "selenium-webdriver";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";

export class CreateRepoFileFragment extends BaseComponent {
  private organizationName?: string;
  private repositoryName?: string;

  private readonly locators = {
    fileName: By.css("#file-name"),
    fileContentInput: By.css(".ui.bottom.attached.segment.tw-p-0"),
    // CodeMirror's own editable region - the segment above only wraps it.
    fileContentEditor: By.css(".ui.bottom.attached.segment.tw-p-0 .cm-content"),
    commitChangesButton: By.css("#commit-button"),
  };

  async waitForElements(organizationName: string, repositoryName: string): Promise<boolean> {
    this.organizationName = organizationName;
    this.repositoryName = repositoryName;
    return this.isVisible([
      this.locators.fileName,
      this.locators.fileContentInput,
      this.locators.commitChangesButton,
    ]);
  }

  // Disabled while the filename is empty; typing a name alone is enough to enable it.
  async fillFileName(name: string): Promise<void> {
    await this.type(this.locators.fileName, name);
    await this.driver.wait(async () => !(await this.isCommitChangesDisabled()), 5000);
  }

  async fillFileContent(content: string): Promise<void> {
    await this.click(this.locators.fileContentEditor);
    await this.type(this.locators.fileContentEditor, content);
  }

  async isCommitChangesDisabled(): Promise<boolean> {
    return (await this.getAttribute(this.locators.commitChangesButton, "disabled")) === "true";
  }

  async clickCommitChangesButton(): Promise<void> {
    await this.click(this.locators.commitChangesButton);
  }
}
